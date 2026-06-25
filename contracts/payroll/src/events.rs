use soroban_sdk::{Address, Env, Symbol};

pub fn batch_processed(
    env:       &Env,
    batch_id:  u64,
    employer:  &Address,
    successful: u32,
    total:     u32,
) {
    let topics = (Symbol::new(env, "batch_processed"), batch_id, employer);
    env.events().publish(topics, (successful, total));
}

pub fn payment_executed(env: &Env, employee: &Address, amount: i128, batch_id: u64) {
    let topics = (Symbol::new(env, "payment_executed"), employee, batch_id);
    env.events().publish(topics, amount);
}

pub fn zk_verification_failed(env: &Env, batch_id: u64) {
    let topics = (Symbol::new(env, "zk_verify_failed"), batch_id);
    env.events().publish(topics, ());
}

pub fn contract_initialized(env: &Env, employer: &Address) {
    let topics = (Symbol::new(env, "initialized"), employer);
    env.events().publish(topics, ());
}
