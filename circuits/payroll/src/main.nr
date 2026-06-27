use dep::std;

fn main(
    employee_ids: [Field; 10],
    salaries: [u64; 10],
    salts: [Field; 10],
    payee_types: [u8; 10],
    token_type: u8,
    commitments: pub [Field; 10],
    total_amount: pub u64,
    employee_total: pub u64,
    contractor_total: pub u64,
    freelancer_total: pub u64,
    vendor_total: pub u64,
    consultant_total: pub u64,
    employee_count: pub u32,
    contractor_count: pub u32,
    freelancer_count: pub u32,
    vendor_count: pub u32,
    consultant_count: pub u32,
    token_type_public: pub u8,
    employee_count_total: pub u32,
) {
    let token_check = token_type as Field;
    assert(token_check * (token_check - 1) == 0);
    assert(token_type_public == token_type);

    let mut total = 0;
    let mut emp_total = 0;
    let mut con_total = 0;
    let mut free_total = 0;
    let mut ven_total = 0;
    let mut cons_total = 0;
    let mut emp_count = 0;
    let mut con_count = 0;
    let mut free_count = 0;
    let mut ven_count = 0;
    let mut cons_count = 0;

    for i in 0..10 {
        if i < employee_count_total {
            assert(salaries[i] > 0);

            let combined_type = (payee_types[i] as Field) * 10 + (token_type as Field);
            
            let input_array = [
                employee_ids[i],
                salaries[i] as Field,
                salts[i],
                combined_type,
            ];

            // 💡 FIXED: Correct standard library Poseidon2 Hash API invocation
            let computed = std::hash::poseidon2::Poseidon2::hash(input_array, 4);

            assert(computed == commitments[i]);

            total += salaries[i];

            if payee_types[i] == 0 {
                emp_total += salaries[i];
                emp_count += 1;
            } else if payee_types[i] == 1 {
                con_total += salaries[i];
                con_count += 1;
            } else if payee_types[i] == 2 {
                free_total += salaries[i];
                free_count += 1;
            } else if payee_types[i] == 3 {
                ven_total += salaries[i];
                ven_count += 1;
            } else if payee_types[i] == 4 {
                cons_total += salaries[i];
                cons_count += 1;
            }
        } else {
            assert(commitments[i] == 0);
            assert(salaries[i] == 0);
            assert(employee_ids[i] == 0);
        }
    }

    assert(total == total_amount);
    assert(emp_total == employee_total);
    assert(con_total == contractor_total);
    assert(free_total == freelancer_total);
    assert(ven_total == vendor_total);
    assert(cons_total == consultant_total);
    assert(emp_count == employee_count);
    assert(con_count == contractor_count);
    assert(free_count == freelancer_count);
    assert(ven_count == vendor_count);
    assert(cons_count == consultant_count);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 TEST: Generate Commitments matching the exact main execution logic
// ─────────────────────────────────────────────────────────────────────────────
#[test]
fn generate_commitments() {
    // XLM Test Data
    let xlm_ids = [1, 2, 3, 0, 0, 0, 0, 0, 0, 0];
    let xlm_salaries = [5000, 3000, 7000, 0, 0, 0, 0, 0, 0, 0];
    let xlm_salts = [12345, 67890, 11111, 0, 0, 0, 0, 0, 0, 0];
    let xlm_payees = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
    let xlm_token = 0;
    let xlm_total = 3;

    std::println("\n================================================");
    std::println("🔥 XLM COMMITMENTS (copy these into Prover.toml)");
    std::println("================================================");

    for i in 0..10 {
        if i < xlm_total {
            let combined = (xlm_payees[i] as Field) * 10 + (xlm_token as Field);
            let input = [xlm_ids[i], xlm_salaries[i] as Field, xlm_salts[i], combined];
            
            // Match the main loop hashing API
            let hash = std::hash::poseidon2::Poseidon2::hash(input, 4);
            
            std::print("    \"");
            std::print(hash);
            std::println("\",");
        } else {
            std::println("    \"0\",");
        }
    }

    // USDC Test Data
    let usdc_ids = [4, 5, 0, 0, 0, 0, 0, 0, 0, 0];
    let usdc_salaries = [10000, 15000, 0, 0, 0, 0, 0, 0, 0, 0];
    let usdc_salts = [99999, 88888, 0, 0, 0, 0, 0, 0, 0, 0];
    let usdc_payees = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let usdc_token = 1;
    let usdc_total = 2;

    std::println("\n================================================");
    std::println("🔥 USDC COMMITMENTS (copy these into Prover.usdc.toml)");
    std::println("================================================");

    for i in 0..10 {
        if i < usdc_total {
            let combined = (usdc_payees[i] as Field) * 10 + (usdc_token as Field);
            let input = [usdc_ids[i], usdc_salaries[i] as Field, usdc_salts[i], combined];
            
            // Match the main loop hashing API
            let hash = std::hash::poseidon2::Poseidon2::hash(input, 4);
            
            std::print("    \"");
            std::print(hash);
            std::println("\",");
        } else {
            std::println("    \"0\",");
        }
    }
    std::println("================================================\n");
}
