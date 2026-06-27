use soroban_sdk::{contracttype, Address, BytesN};

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum PayeeType {
    Employee = 0,
    Contractor = 1,
    Freelancer = 2,
    Vendor = 3,
    Consultant = 4,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracttype]
pub enum TokenType {
    XLM = 0,
    USDC = 1,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Payee {
    pub address: Address,
    pub amount: i128,
    pub payee_type: PayeeType,
    pub token_type: TokenType,
    pub commitment: BytesN<32>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct PayrollAudit {
    pub batch_id: u64,
    pub employer: Address,
    pub total_amount: i128,
    pub total_xlm: i128,
    pub total_usdc: i128,
    pub employee_total: i128,
    pub contractor_total: i128,
    pub freelancer_total: i128,
    pub vendor_total: i128,
    pub consultant_total: i128,
    pub employee_count: u32,
    pub contractor_count: u32,
    pub freelancer_count: u32,
    pub vendor_count: u32,
    pub consultant_count: u32,
    pub tx_hash: BytesN<32>,
    pub timestamp: u64,
    pub proof_hash: BytesN<32>,
    pub is_verified: bool,
}
