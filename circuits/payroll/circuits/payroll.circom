pragma circom 2.2.0;

include "circomlib/circuits/poseidon.circom";

template IsZero() {
    signal input in;
    signal output out;

    signal inv;
    inv <-- in != 0 ? 1 / in : 0;

    out <== 1 - in * inv;
    in * out === 0;
}

template IsEqual() {
    signal input a;
    signal input b;
    signal output out;

    component is_zero = IsZero();
    is_zero.in <== a - b;
    out <== is_zero.out;
}

template PayrollCommitment() {
    signal input payee_id;
    signal input recipient_hash;
    signal input amount;
    signal input payee_type;
    signal input token_type;
    signal input period_id;
    signal input salt;

    signal output commitment;

    component poseidon = Poseidon(7);
    poseidon.inputs[0] <== payee_id;
    poseidon.inputs[1] <== recipient_hash;
    poseidon.inputs[2] <== amount;
    poseidon.inputs[3] <== payee_type;
    poseidon.inputs[4] <== token_type;
    poseidon.inputs[5] <== period_id;
    poseidon.inputs[6] <== salt;

    commitment <== poseidon.out;
}

template Merkle8() {
    signal input leaves[8];
    signal output root;

    component h01 = Poseidon(2);
    component h23 = Poseidon(2);
    component h45 = Poseidon(2);
    component h67 = Poseidon(2);

    h01.inputs[0] <== leaves[0];
    h01.inputs[1] <== leaves[1];

    h23.inputs[0] <== leaves[2];
    h23.inputs[1] <== leaves[3];

    h45.inputs[0] <== leaves[4];
    h45.inputs[1] <== leaves[5];

    h67.inputs[0] <== leaves[6];
    h67.inputs[1] <== leaves[7];

    component h0123 = Poseidon(2);
    component h4567 = Poseidon(2);

    h0123.inputs[0] <== h01.out;
    h0123.inputs[1] <== h23.out;

    h4567.inputs[0] <== h45.out;
    h4567.inputs[1] <== h67.out;

    component hroot = Poseidon(2);
    hroot.inputs[0] <== h0123.out;
    hroot.inputs[1] <== h4567.out;

    root <== hroot.out;
}

template PayrollBatch(maxPayees) {
    signal input payee_ids[maxPayees];
    signal input recipient_hashes[maxPayees];
    signal input amounts[maxPayees];
    signal input salts[maxPayees];
    signal input payee_types[maxPayees];
    signal input token_types[maxPayees];

    signal input period_id;
    signal input payroll_run_hash;
    signal input batch_index;
    signal input batch_count;

    signal input commitments[maxPayees];
    signal input batch_root_public;

    signal input total_amount;
    signal input total_xlm;
    signal input total_usdc;

    signal input employee_total;
    signal input contractor_total;
    signal input freelancer_total;
    signal input vendor_total;
    signal input consultant_total;
    signal input contributor_total;

    signal input employee_count;
    signal input contractor_count;
    signal input freelancer_count;
    signal input vendor_count;
    signal input consultant_count;
    signal input contributor_count;

    signal input period_id_public;
    signal input payroll_run_hash_public;
    signal input batch_index_public;
    signal input batch_count_public;
    signal input payee_count_total;

    period_id_public === period_id;
    payroll_run_hash_public === payroll_run_hash;
    batch_index_public === batch_index;
    batch_count_public === batch_count;

    signal running_total[maxPayees + 1];
    signal running_total_xlm[maxPayees + 1];
    signal running_total_usdc[maxPayees + 1];

    signal running_employee_total[maxPayees + 1];
    signal running_contractor_total[maxPayees + 1];
    signal running_freelancer_total[maxPayees + 1];
    signal running_vendor_total[maxPayees + 1];
    signal running_consultant_total[maxPayees + 1];
    signal running_contributor_total[maxPayees + 1];

    signal running_employee_count[maxPayees + 1];
    signal running_contractor_count[maxPayees + 1];
    signal running_freelancer_count[maxPayees + 1];
    signal running_vendor_count[maxPayees + 1];
    signal running_consultant_count[maxPayees + 1];
    signal running_contributor_count[maxPayees + 1];

    running_total[0] <== 0;
    running_total_xlm[0] <== 0;
    running_total_usdc[0] <== 0;

    running_employee_total[0] <== 0;
    running_contractor_total[0] <== 0;
    running_freelancer_total[0] <== 0;
    running_vendor_total[0] <== 0;
    running_consultant_total[0] <== 0;
    running_contributor_total[0] <== 0;

    running_employee_count[0] <== 0;
    running_contractor_count[0] <== 0;
    running_freelancer_count[0] <== 0;
    running_vendor_count[0] <== 0;
    running_consultant_count[0] <== 0;
    running_contributor_count[0] <== 0;

    component is_zero_amount[maxPayees];

    component is_employee[maxPayees];
    component is_contractor[maxPayees];
    component is_freelancer[maxPayees];
    component is_vendor[maxPayees];
    component is_consultant[maxPayees];
    component is_contributor[maxPayees];

    component is_xlm[maxPayees];
    component is_usdc[maxPayees];

    component commitments_calc[maxPayees];

    signal is_paid[maxPayees];
    signal active_amount[maxPayees];

    signal employee_amount[maxPayees];
    signal contractor_amount[maxPayees];
    signal freelancer_amount[maxPayees];
    signal vendor_amount[maxPayees];
    signal consultant_amount[maxPayees];
    signal contributor_amount[maxPayees];

    signal xlm_amount[maxPayees];
    signal usdc_amount[maxPayees];

    for (var i = 0; i < maxPayees; i++) {
        is_zero_amount[i] = IsZero();
        is_zero_amount[i].in <== amounts[i];

        is_paid[i] <== 1 - is_zero_amount[i].out;

        is_employee[i] = IsEqual();
        is_employee[i].a <== payee_types[i];
        is_employee[i].b <== 0;

        is_contractor[i] = IsEqual();
        is_contractor[i].a <== payee_types[i];
        is_contractor[i].b <== 1;

        is_freelancer[i] = IsEqual();
        is_freelancer[i].a <== payee_types[i];
        is_freelancer[i].b <== 2;

        is_vendor[i] = IsEqual();
        is_vendor[i].a <== payee_types[i];
        is_vendor[i].b <== 3;

        is_consultant[i] = IsEqual();
        is_consultant[i].a <== payee_types[i];
        is_consultant[i].b <== 4;

        is_contributor[i] = IsEqual();
        is_contributor[i].a <== payee_types[i];
        is_contributor[i].b <== 5;

        is_employee[i].out
            + is_contractor[i].out
            + is_freelancer[i].out
            + is_vendor[i].out
            + is_consultant[i].out
            + is_contributor[i].out === 1;

        is_xlm[i] = IsEqual();
        is_xlm[i].a <== token_types[i];
        is_xlm[i].b <== 0;

        is_usdc[i] = IsEqual();
        is_usdc[i].a <== token_types[i];
        is_usdc[i].b <== 1;

        is_xlm[i].out + is_usdc[i].out === 1;

        commitments_calc[i] = PayrollCommitment();
        commitments_calc[i].payee_id <== payee_ids[i];
        commitments_calc[i].recipient_hash <== recipient_hashes[i];
        commitments_calc[i].amount <== amounts[i];
        commitments_calc[i].payee_type <== payee_types[i];
        commitments_calc[i].token_type <== token_types[i];
        commitments_calc[i].period_id <== period_id;
        commitments_calc[i].salt <== salts[i];

        (commitments_calc[i].commitment - commitments[i]) * is_paid[i] === 0;
        commitments[i] * is_zero_amount[i].out === 0;

        active_amount[i] <== amounts[i];

        employee_amount[i] <== active_amount[i] * is_employee[i].out;
        contractor_amount[i] <== active_amount[i] * is_contractor[i].out;
        freelancer_amount[i] <== active_amount[i] * is_freelancer[i].out;
        vendor_amount[i] <== active_amount[i] * is_vendor[i].out;
        consultant_amount[i] <== active_amount[i] * is_consultant[i].out;
        contributor_amount[i] <== active_amount[i] * is_contributor[i].out;

        xlm_amount[i] <== active_amount[i] * is_xlm[i].out;
        usdc_amount[i] <== active_amount[i] * is_usdc[i].out;

        running_total[i + 1] <== running_total[i] + active_amount[i];
        running_total_xlm[i + 1] <== running_total_xlm[i] + xlm_amount[i];
        running_total_usdc[i + 1] <== running_total_usdc[i] + usdc_amount[i];

        running_employee_total[i + 1] <== running_employee_total[i] + employee_amount[i];
        running_contractor_total[i + 1] <== running_contractor_total[i] + contractor_amount[i];
        running_freelancer_total[i + 1] <== running_freelancer_total[i] + freelancer_amount[i];
        running_vendor_total[i + 1] <== running_vendor_total[i] + vendor_amount[i];
        running_consultant_total[i + 1] <== running_consultant_total[i] + consultant_amount[i];
        running_contributor_total[i + 1] <== running_contributor_total[i] + contributor_amount[i];

        running_employee_count[i + 1] <== running_employee_count[i] + is_paid[i] * is_employee[i].out;
        running_contractor_count[i + 1] <== running_contractor_count[i] + is_paid[i] * is_contractor[i].out;
        running_freelancer_count[i + 1] <== running_freelancer_count[i] + is_paid[i] * is_freelancer[i].out;
        running_vendor_count[i + 1] <== running_vendor_count[i] + is_paid[i] * is_vendor[i].out;
        running_consultant_count[i + 1] <== running_consultant_count[i] + is_paid[i] * is_consultant[i].out;
        running_contributor_count[i + 1] <== running_contributor_count[i] + is_paid[i] * is_contributor[i].out;
    }

    component merkle = Merkle8();

    for (var j = 0; j < 8; j++) {
        merkle.leaves[j] <== commitments[j];
    }

    merkle.root === batch_root_public;

    running_total[maxPayees] === total_amount;
    running_total_xlm[maxPayees] === total_xlm;
    running_total_usdc[maxPayees] === total_usdc;

    running_employee_total[maxPayees] === employee_total;
    running_contractor_total[maxPayees] === contractor_total;
    running_freelancer_total[maxPayees] === freelancer_total;
    running_vendor_total[maxPayees] === vendor_total;
    running_consultant_total[maxPayees] === consultant_total;
    running_contributor_total[maxPayees] === contributor_total;

    running_employee_count[maxPayees] === employee_count;
    running_contractor_count[maxPayees] === contractor_count;
    running_freelancer_count[maxPayees] === freelancer_count;
    running_vendor_count[maxPayees] === vendor_count;
    running_consultant_count[maxPayees] === consultant_count;
    running_contributor_count[maxPayees] === contributor_count;

    payee_count_total === employee_count
        + contractor_count
        + freelancer_count
        + vendor_count
        + consultant_count
        + contributor_count;
}

component main { public [
    commitments,
    batch_root_public,
    total_amount,
    total_xlm,
    total_usdc,
    employee_total,
    contractor_total,
    freelancer_total,
    vendor_total,
    consultant_total,
    contributor_total,
    employee_count,
    contractor_count,
    freelancer_count,
    vendor_count,
    consultant_count,
    contributor_count,
    period_id_public,
    payroll_run_hash_public,
    batch_index_public,
    batch_count_public,
    payee_count_total
] } = PayrollBatch(8);