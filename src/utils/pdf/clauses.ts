/**
 * Structured Terms & Conditions for the Loan Agreement.
 * Each clause group is rendered as a numbered section with sub-points.
 */

export interface ClauseSection {
    heading: string;
    points: string[];
}

export function getClauseSections(): ClauseSection[] {
    return [
        {
            heading: 'Definitions and Interpretation',
            points: [
                'In this Agreement, unless the context otherwise requires, the term "Lender" shall mean Champanand Motors Pvt Ltd, its successors, assigns, nominees, representatives and authorised personnel; the term "Borrower" shall mean the person(s) named in the schedule of this Agreement and shall include their legal heirs, executors, administrators and permitted assigns; the term "Loan" shall mean the principal amount sanctioned by the Lender as recorded in the schedule together with all interest, charges, costs and other dues payable thereon.',
                'Headings are inserted for convenience only and shall not affect the construction of this Agreement. Words in the singular include the plural and vice versa, and words in any one gender include the other genders.',
                'Reference to any statute or regulation includes any modification, re-enactment or replacement thereof for the time being in force.',
            ],
        },
        {
            heading: 'Sanction, Disbursement and Loan Account',
            points: [
                'The Lender shall, at its sole discretion, sanction and disburse the Loan to the Borrower upon execution of this Agreement, completion of all documentation, satisfactory verification of submitted documents, and fulfilment of any conditions precedent stipulated by the Lender.',
                'The Loan shall be disbursed only after the Borrower has signed all required documents, including this Agreement, repayment authorisation forms, demand promissory notes, and any other instruments required by the Lender.',
                'The Lender reserves the right to refuse, defer, reduce or recall the Loan at any time without assigning any reason, and the Borrower shall not be entitled to claim any damages or compensation on this account.',
                'The Loan shall be disbursed by such mode (cash, account transfer, demand draft or other instrument) as determined by the Lender. Once disbursed, the Borrower acknowledges receipt unconditionally.',
                'The Lender shall maintain a Loan account in the name of the Borrower, and the entries made therein in the ordinary course of business shall be conclusive evidence of the amounts owed by the Borrower, save for manifest error.',
            ],
        },
        {
            heading: 'Interest, Charges and Computation',
            points: [
                'Interest shall be charged on the Loan at the rate, type (Flat or Reducing Balance), and on the basis as recorded in the loan schedule annexed to this Agreement, and shall accrue from the date of disbursement until full repayment.',
                'The Lender may, at its sole discretion and from time to time, revise the interest rate, processing fee, insurance fee, penal interest, late payment charges, foreclosure charges and any other applicable charges, with notice to the Borrower as required by applicable law.',
                'In the event of any delay or default in payment of any Equated Monthly Instalment ("EMI") or other sums due, the Borrower shall be liable to pay penal interest, late payment charges and additional cost of collection as per the Lender\'s prevailing policy.',
                'All amounts payable under this Agreement shall be paid free and clear of any deduction, set-off, counterclaim or withholding, save where such deduction or withholding is required by law.',
                'Statutory taxes, duties, GST or other levies, present or future, on the Loan or any amount payable shall be borne and paid by the Borrower in addition to the contracted amount.',
            ],
        },
        {
            heading: 'Repayment and Mode of Payment',
            points: [
                'The Borrower shall repay the Loan together with interest, charges and other dues by way of EMIs as per the repayment schedule annexed hereto, the receipt and correctness of which is acknowledged by the Borrower.',
                'EMIs shall be paid on or before the due date as specified in the repayment schedule, irrespective of any holiday or non-business day.',
                'Repayment shall be made through such modes as approved by the Lender including National Automated Clearing House (NACH) mandate, post-dated cheques, electronic clearing, UPI, NEFT/IMPS/RTGS, demand draft or cash, as agreed.',
                'The Borrower shall ensure sufficient funds in the designated bank account to honour all instructions/mandates. Any dishonour shall attract dishonour charges in addition to penal interest, and may also render the Borrower liable for prosecution under Section 138 of the Negotiable Instruments Act, 1881.',
                'Any sum received from the Borrower shall be appropriated by the Lender first towards costs, charges and expenses, then towards penal interest, then towards interest, and lastly towards the principal amount, irrespective of any contrary instruction.',
                'Premature repayment / foreclosure of the Loan shall be permitted only with the prior written consent of the Lender and shall be subject to such foreclosure charges and conditions as may be applicable.',
            ],
        },
        {
            heading: 'Security and Hypothecation',
            points: [
                'Where the Loan is granted for purchase of a vehicle, the said vehicle shall stand hypothecated to the Lender as security for due repayment of the Loan and all dues, until the entire Loan is fully repaid and a No Objection Certificate is issued by the Lender.',
                'The Borrower shall not sell, transfer, encumber, lease, gift, pledge or otherwise alienate the hypothecated vehicle without the prior written consent of the Lender.',
                'The Borrower shall, at his/her own cost, comprehensively insure the hypothecated asset, and assign such insurance in favour of the Lender, and renew the same uninterruptedly until the Loan is fully repaid.',
                'In addition to the security stated, the Borrower shall furnish such guarantees, post-dated cheques, demand promissory notes and other documents as may be required by the Lender.',
                'The Lender shall have a paramount lien and right of set-off on all monies, securities, deposits or other assets of the Borrower lying with the Lender.',
            ],
        },
        {
            heading: 'Representations, Warranties and Covenants',
            points: [
                'The Borrower represents and warrants that all information, statements, documents and particulars furnished to the Lender are true, complete, accurate and not misleading in any respect, and that no material fact has been concealed.',
                'The Borrower has full legal capacity to enter into this Agreement and is not insolvent, bankrupt, or under any legal disability.',
                'There are no pending or threatened civil, criminal, tax, recovery or other legal proceedings against the Borrower that may adversely affect the Borrower\'s ability to repay.',
                'The Borrower shall promptly notify the Lender of any change in residence, employment, contact details, marital status, or any event likely to affect the Borrower\'s capacity to repay.',
                'The Borrower undertakes not to use the Loan proceeds for any speculative, unlawful, anti-social, or capital-market activity, and shall use the funds only for the stated purpose.',
            ],
        },
        {
            heading: 'Events of Default',
            points: [
                'The occurrence of any of the following shall constitute an "Event of Default": (a) failure to pay any sum on the due date; (b) breach of any term, covenant, representation or warranty under this Agreement; (c) any document, statement or information furnished being false, misleading or incorrect; (d) any insolvency, bankruptcy, winding-up or similar proceeding initiated against the Borrower; (e) the Borrower ceasing or threatening to cease to carry on business; (f) attachment, distress, execution or other legal process being levied or enforced upon any of the Borrower\'s assets; (g) death or permanent incapacity of the Borrower in case of an individual; (h) any other event which in the sole opinion of the Lender adversely affects the Borrower\'s ability or willingness to repay.',
                'On the occurrence of an Event of Default, the entire outstanding amount, including principal, accrued interest, penal interest, charges and costs, shall, without prejudice to any other rights of the Lender, become immediately due and payable, notwithstanding the agreed repayment schedule.',
                'The Lender shall, in addition, have the right to take possession of the hypothecated asset, sell or otherwise dispose of the same, and adjust the proceeds against the dues, all without prejudice to its right to recover any shortfall.',
            ],
        },
        {
            heading: 'Recovery, Repossession and Legal Action',
            points: [
                'The Borrower expressly authorises the Lender, its officers, agents, recovery executives or any person duly authorised by the Lender, to enter upon any premises where the hypothecated asset may be kept, take possession thereof and remove the same for the purpose of sale or otherwise, without being liable for trespass or any other tort.',
                'The Lender may, at its sole discretion and at the cost of the Borrower, engage external recovery agents, collection professionals, lawyers, courts or arbitration tribunals for recovery of dues.',
                'The Lender may institute civil or criminal proceedings, including summary suits and proceedings under Section 138 of the Negotiable Instruments Act, 1881, the Indian Penal Code, 1860, and any other applicable law, for recovery of dues and protection of its interest.',
                'All costs, charges, expenses, fees, taxes, court fees and incidental charges incurred by the Lender in enforcement, recovery, repossession, sale and litigation shall be borne entirely by the Borrower and shall form part of the secured obligations.',
            ],
        },
        {
            heading: 'Verification, Inspection and Credit Information',
            points: [
                'The Borrower hereby authorises the Lender, and its representatives or third-party agencies, to undertake field verification, residence verification, employment verification, telephonic verification, reference checks and any other due diligence at the Borrower\'s residence or place of work, at any reasonable time.',
                'The Borrower hereby authorises the Lender to procure a credit report and credit score from any credit information company including TransUnion CIBIL, Experian, Equifax, CRIF Highmark, and to share information regarding the Borrower\'s account, conduct and default with such companies.',
                'In the event of default, the Borrower\'s name and details shall be reported to credit information companies, regulators and other authorities as required, and may impair the Borrower\'s future ability to obtain credit.',
            ],
        },
        {
            heading: 'Data Protection, Consent and Communication',
            points: [
                'The Borrower hereby consents to the collection, storage, processing, transmission and use of personal information, including biometric and KYC data, by the Lender for the purpose of evaluation, sanction, administration, recovery and enforcement of this Loan, and for compliance with applicable law.',
                'The Borrower authorises the Lender to share information with regulators, statutory authorities, group companies, vendors, service providers, lawyers, recovery agents, insurers and credit bureaus as may be necessary.',
                'All notices, communications, demands, statements and intimations from the Lender shall be deemed validly served if sent to the address, email, or mobile number recorded with the Lender, by ordinary post, registered post, courier, hand delivery, electronic mail, SMS, WhatsApp or any other electronic mode.',
                'Communication delivered by electronic means shall be valid and binding under the Information Technology Act, 2000 and other applicable laws.',
            ],
        },
        {
            heading: 'Insurance',
            points: [
                'The Borrower shall, at all times during the currency of the Loan, keep the hypothecated asset insured against fire, theft, accidental damage, third-party liability and such other risks as required by law and as required by the Lender, and shall pay all premiums punctually.',
                'The Borrower shall assign the insurance policy in favour of the Lender, and shall produce evidence of premium payment whenever called upon.',
                'In the event of any claim under the insurance policy, the proceeds shall be paid directly to the Lender to be appropriated against outstanding dues.',
                'Any insurance fee or premium financed by the Lender as part of the Loan is non-refundable, save as provided by the insurer.',
            ],
        },
        {
            heading: 'Assignment, Transfer and Securitisation',
            points: [
                'The Lender may, at its absolute discretion and without notice or consent of the Borrower, sell, assign, transfer, securitise or otherwise deal with the Loan and the security therefor in whole or in part, on such terms as it may deem fit.',
                'The Borrower shall not assign, transfer or part with any of the Borrower\'s rights or obligations under this Agreement without the prior written consent of the Lender.',
                'The Borrower shall execute such further documents and do such acts as may be necessary to give effect to such assignment or transfer.',
            ],
        },
        {
            heading: 'Indemnity and Limitation of Liability',
            points: [
                'The Borrower shall indemnify and keep indemnified the Lender, its directors, officers, employees and agents, from and against all losses, damages, claims, demands, costs, charges and expenses arising out of any breach of this Agreement, any misrepresentation or any act or omission of the Borrower.',
                'The Lender shall not be liable for any indirect, incidental or consequential losses suffered by the Borrower howsoever arising.',
                'No delay or forbearance by the Lender in exercising any right under this Agreement shall be construed as a waiver thereof.',
            ],
        },
        {
            heading: 'Force Majeure',
            points: [
                'Neither party shall be in breach of this Agreement to the extent that performance is prevented by an event of force majeure, including acts of God, war, terrorism, civil unrest, governmental restrictions, epidemic, pandemic, lockdown, fire, flood or other event beyond reasonable control.',
                'A force majeure event shall not, however, in any manner whatsoever, relieve the Borrower of the obligation to repay the Loan and accrued interest.',
            ],
        },
        {
            heading: 'Governing Law, Jurisdiction and Arbitration',
            points: [
                'This Agreement shall be governed by and construed in accordance with the laws of India.',
                'All disputes, differences, claims or questions arising out of or in connection with this Agreement shall, at the option of the Lender, be referred to arbitration by a sole arbitrator appointed by the Lender, in accordance with the Arbitration and Conciliation Act, 1996. The seat of arbitration shall be the city in which the Lender\'s registered office is situated, and the language shall be English.',
                'Subject to the above, the courts and tribunals at the place of the Lender\'s registered office shall have exclusive jurisdiction to entertain any matter relating to this Agreement.',
            ],
        },
        {
            heading: 'Severability, Amendment and Entire Agreement',
            points: [
                'If any provision of this Agreement is held to be invalid, illegal or unenforceable, the remaining provisions shall continue in full force and effect.',
                'No amendment or modification to this Agreement shall be valid unless made in writing and signed by both parties; provided that the Lender may unilaterally amend the schedule of charges, fees and interest by giving notice in accordance with applicable law.',
                'This Agreement, together with the schedules and annexures hereto and the application form, constitutes the entire understanding between the parties and supersedes all prior negotiations, representations and agreements.',
            ],
        },
        {
            heading: 'Acknowledgement and Declaration by the Borrower',
            points: [
                'The Borrower confirms having read, understood and accepted all the terms and conditions of this Agreement, and acknowledges that the same have been explained in a language understood by the Borrower.',
                'The Borrower confirms that the Loan is being availed for lawful purpose, of own free will and without coercion, undue influence, fraud or misrepresentation.',
                'The Borrower agrees that this Agreement shall be binding on the Borrower\'s legal heirs, successors and representatives.',
                'The Borrower acknowledges receipt of a copy of this Agreement and of the most-important-terms-and-conditions document.',
            ],
        },
    ];
}

/* Backwards-compatible export expected by older imports. */
export function getClauses(): string[] {
    return getClauseSections().flatMap((s) => s.points);
}
