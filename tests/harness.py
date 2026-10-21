"""
Loads the REAL contract file against the doubles in genvm_double.py.

Nothing is copied or re-implemented here, so a change to contracts/samepage.py
is a change to what these tests exercise. The runner comment on the first lines
of the contract is ignored by CPython, so the file imports as ordinary Python.

The seals the tests send are made here with hashlib, independently of the
contract's own seal_of, so a contract that hashed the wrong bytes would refuse
every reveal below. tests/vectors.json pins both sides.
"""

from __future__ import annotations

import datetime
import hashlib
import importlib.util
import json
import os
import pathlib
import sys
import types

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
#: SAMEPAGE_CONTRACT points the suite at a mutant; scripts/mutate.py sets it.
CONTRACT = pathlib.Path(os.environ.get("SAMEPAGE_CONTRACT") or ROOT / "contracts" / "samepage.py")

sys.path.insert(0, str(HERE))

import genvm_double as D  # noqa: E402

GEN = 10**18
HOUR = 3600

#: 2026-09-01T00:00:00Z. Every world starts here.
T0 = 1788220800

TERMS = ("amount", "deliverable", "deadline", "payment", "rights", "cancellation")


def _install(gl: D.GL) -> None:
    """
    Publish a `genlayer` package shaped like py-genlayer:5jycge4q (Studio Next):
    the star import brings Address and the integer types, `import genlayer as gl`
    is the package itself, and the storage names live in genlayer.storage. An
    import the contract left out fails here rather than on chain.
    """
    storage = types.ModuleType("genlayer.storage")
    storage.TreeMap = D.TreeMap
    storage.DynArray = D.DynArray
    storage.allow = D.allow_storage
    module = types.ModuleType("genlayer")
    module.Address = D.Address
    for name in ("u8", "u16", "u32", "u64", "u256"):
        setattr(module, name, getattr(D, name))
    for name in ("contract", "vm", "message", "public", "nondet", "evm"):
        setattr(module, name, getattr(gl, name))
    module.storage = storage
    module.__all__ = ["Address", "u8", "u16", "u32", "u64", "u256"]
    sys.modules["genlayer"] = module
    sys.modules["genlayer.storage"] = storage


def load(gl: D.GL, path: pathlib.Path | None = None, name: str = "samepage_contract") -> types.ModuleType:
    """Import the contract fresh against this gl."""
    _install(gl)
    spec = importlib.util.spec_from_file_location(name, path or CONTRACT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


# --- seals, made independently of the contract ---------------------------------


def seal(text: str, salt: str, address: str) -> str:
    return hashlib.sha256(f"{text}|{salt}|{address.lower()}".encode("utf-8")).hexdigest()


# --- the deal the tests use ----------------------------------------------------------

TITLE = "Kiln launch posts"
KILN = "Sera writes 3 posts and a thread on X about the Kiln launch, all live by Oct 24. Kiln pays 600 USDC, all of it after the last post."
SERA = "I post 3 times on X about Kiln's launch, by Oct 24, for 600 USDC, half before I start and half after. Kiln can repost."


def judged(*statuses: str, notes: dict | None = None) -> str:
    """A judge answer the way a model writes it: six statuses in TERMS order, and notes."""
    body = {term: status for term, status in zip(TERMS, statuses)}
    body["notes"] = notes if notes is not None else {term: f"{term}: what each side says" for term in TERMS}
    return json.dumps(body)


SAME = judged("MATCH", "MATCH", "MATCH", "MATCH", "ABSENT", "ABSENT")
TWO_DIFFER = judged("MATCH", "DIFFER", "MATCH", "DIFFER", "MATCH", "ABSENT")
GAPPY = judged("ABSENT", "MATCH", "ABSENT", "ABSENT", "ABSENT", "ABSENT")


class World:
    """
    One Samepage contract and the accounts around it.

    Time is explicit: `at(seconds)` sets the transaction datetime the contract
    reads, because nothing on chain moves the clock on its own and the windows
    are what these tests most need to control.
    """

    OPENER = "0x" + "a1" * 20
    OTHER = "0x" + "b2" * 20
    STRANGER = "0x" + "d4" * 20
    DEPOSIT = 20 * GEN

    def __init__(self) -> None:
        self.gl = D.GL()
        self.mod = load(self.gl)
        self.at(T0)
        self.sender(self.OPENER)
        self.c = self.mod.Samepage()
        #: (page, round, lower-case address) -> (text, salt) sealed
        self.tickets: dict[tuple[int, int, str], tuple[str, str]] = {}

    # -- controls ----------------------------------------------------------

    def at(self, seconds: int) -> "World":
        self.t = int(seconds)
        stamp = datetime.datetime.fromtimestamp(self.t, datetime.timezone.utc)
        self.gl.message.raw["datetime"] = stamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        return self

    def advance(self, seconds: int) -> "World":
        return self.at(self.t + seconds)

    def sender(self, address: str, value: int = 0) -> "World":
        self.gl.message.sender_address = D.Address(address)
        self.gl.message.origin_address = D.Address(address)
        self.gl.message.value = int(value)
        return self

    @property
    def leader(self) -> D.NodeWorld:
        return self.gl.nondet.leader

    @property
    def validators(self) -> list[D.NodeWorld]:
        return self.gl.nondet.validators

    # -- shorthands --------------------------------------------------------

    def open(self, title=TITLE, counterparty=None, deposit=None, window=48, value=None, who=None) -> int:
        deposit = self.DEPOSIT if deposit is None else deposit
        self.sender(who or self.OPENER, deposit if value is None else value)
        try:
            return int(self.c.open_page(title, counterparty or self.OTHER, deposit, window))
        finally:
            self.sender(who or self.OPENER)

    def join(self, pid: int = 1, who=None, value=None) -> str:
        page = self.page(pid)
        self.sender(who or self.OTHER, int(page.get("deposit", 0)) if value is None else value)
        try:
            return str(self.c.join(pid))
        finally:
            self.sender(who or self.OTHER)

    def seal(self, who: str, text: str, pid: int = 1, salt: str | None = None, seal_hex=None) -> str:
        page = self.page(pid)
        salt = salt or ("salt-" + who[2:14] + "-r" + str(page["round"]))
        self.tickets[(pid, page["round"], who.lower())] = (text, salt)
        self.sender(who)
        return str(self.c.seal(pid, seal_hex if seal_hex is not None else seal(text, salt, who)))

    def reveal(self, who: str, pid: int = 1, text=None, salt=None) -> str:
        page = self.page(pid)
        sealed_text, sealed_salt = self.tickets[(pid, page["round"], who.lower())]
        self.sender(who)
        return str(self.c.reveal(pid, sealed_text if text is None else text, sealed_salt if salt is None else salt))

    def queue(self, *answers, validator=None) -> None:
        """Model answers for the leader, in call order, and the same (or `validator`) for each validator."""
        for a in answers:
            self.leader.answers.append(a)
        for world in self.validators:
            for a in validator if validator is not None else answers:
                world.answers.append(a)

    def check(self, pid: int = 1, *answers, who=None, validator=None) -> str:
        """check(), with each answer queued for both presentation orders unless two are given per call."""
        if answers:
            self.queue(*answers, validator=validator)
        self.sender(who or self.STRANGER)
        return str(self.c.check(pid))

    def sign(self, who: str, pid: int = 1) -> str:
        self.sender(who)
        return str(self.c.sign(pid))

    def no_show(self, pid: int = 1, who=None) -> str:
        self.sender(who or self.STRANGER)
        return str(self.c.no_show(pid))

    def withdraw(self, who: str) -> int:
        self.sender(who)
        return int(self.c.withdraw())

    def to_reveal(self, pid: int = 1, a=KILN, b=SERA) -> "World":
        """Join if needed, then seal both accounts: the page is on REVEAL."""
        if self.page(pid)["step"] == "JOIN":
            self.join(pid)
        self.seal(self.OPENER, a, pid)
        self.seal(self.OTHER, b, pid)
        return self

    def to_check(self, pid: int = 1, a=KILN, b=SERA) -> "World":
        """Seal and open both accounts: the page is on CHECK."""
        self.to_reveal(pid, a, b)
        self.reveal(self.OPENER, pid)
        self.reveal(self.OTHER, pid)
        return self

    def agree(self, pid: int = 1) -> "World":
        """Round 1 checks SAME_PAGE and both sign."""
        self.to_check(pid)
        self.check(pid, SAME, SAME)
        self.sign(self.OPENER, pid)
        self.sign(self.OTHER, pid)
        return self

    def to_end(self, pid: int = 1) -> "World":
        return self.at(self.page(pid)["step_end"])

    # -- reads -------------------------------------------------------------

    def page(self, pid: int = 1) -> dict:
        return json.loads(self.c.get_page(pid))

    def round(self, pid: int = 1, number: int | None = None) -> dict:
        p = self.page(pid)
        return p["rounds"][(number or p["round"]) - 1]

    def pages(self, address: str = "", offset: int = 0, limit: int = 50) -> dict:
        return json.loads(self.c.list_pages(address, offset, limit))

    def balance(self, who: str) -> int:
        return int(self.pages(who)["balance"])

    def paid_to(self, address: str) -> int:
        return sum(t.value for t in self.gl.bus.transfers if t.to.lower() == address.lower())

    def paid_out(self) -> int:
        return sum(t.value for t in self.gl.bus.transfers)

    def credited(self) -> int:
        """Every wei credited and not yet withdrawn, over every account the contract knows."""
        return sum(int(v) for v in dict.values(self.c.balances))


def refused(prefix: str, fn, *args, **kwargs) -> str:
    """Assert the call is refused, and that the refusal is the sentence it should be."""
    try:
        fn(*args, **kwargs)
    except D.UserError as error:
        message = str(error)
        assert message.startswith("[EXPECTED] "), f"unprefixed refusal: {message}"
        assert prefix in message, f"expected {prefix!r}, got {message!r}"
        return message
    raise AssertionError(f"expected a refusal containing {prefix!r}, nothing was raised")
