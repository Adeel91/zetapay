use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PayrollError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    OnlyEmployer = 3,
    InvalidProof = 4,
    CommitmentMismatch = 5,
    NoPayees = 6,
    AmountMismatch = 7,
    AlreadyProcessed = 8,
    NotAuthorized = 9,
    MalformedInput = 10,
    VerifierError = 11,
    InvalidToken = 12,
    TokenNotRegistered = 13,
}
