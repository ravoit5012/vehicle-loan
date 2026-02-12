import { CollectionFrequency } from '../../common/enums/collection-frequency.enum';
import { FeesPaymentMethod } from '../../common/enums/fee-payment.enum';
import { InterestType } from '@prisma/client';
export function getPeriodsPerYear(freq: CollectionFrequency): number {
  switch (freq) {
    case 'WEEKLY': return 52;
    case 'BIWEEKLY': return 26;
    case 'MONTHLY': return 12;
    case 'QUARTERLY': return 4;
    default: throw new Error('Invalid frequency');
  }
}

export function getTotalInstallments(
  durationMonths: number,
  freq: CollectionFrequency
): number {
  const N = getPeriodsPerYear(freq);
  return Math.round((durationMonths * N) / 12);
}

export function calculateFee(
  principal: number,
  fee: { amount: number; isPercentage: boolean }
): number {
  if (fee.isPercentage) {
    return (principal * fee.amount) / 100;
  }
  return fee.amount;
}

export function calculateTotalFees(
  principal: number,
  processingFee,
  insuranceFee,
  otherFees: any[]
): number {
  let total = 0;

  total += calculateFee(principal, processingFee);
  total += calculateFee(principal, insuranceFee);

  for (const fee of otherFees) {
    total += calculateFee(principal, fee);
  }

  return total;
}

export function calculateFlatLoan(
  principal: number,
  annualRate: number,
  durationMonths: number,
  freq: CollectionFrequency
) {
  const totalInterest =
    principal * (annualRate / 100) * (durationMonths / 12);

  const totalPayable = principal + totalInterest;
  const installments = getTotalInstallments(durationMonths, freq);
  const emi = totalPayable / installments;

  return {
    emi,
    totalInterest,
    totalPayable,
    installments,
  };
}

export function calculateReducingLoan(
  principal: number,
  annualRate: number,
  durationMonths: number,
  freq: CollectionFrequency
) {
  const N = getPeriodsPerYear(freq);
  const r = annualRate / (100 * N);
  const n = getTotalInstallments(durationMonths, freq);

  const emi =
    (principal * r * Math.pow(1 + r, n)) /
    (Math.pow(1 + r, n) - 1);

  const totalPayable = emi * n;
  const totalInterest = totalPayable - principal;

  return {
    emi,
    totalInterest,
    totalPayable,
    installments: n,
  };
}


interface EmiScheduleItem {
  emiNumber: number;
  dueDate: Date;
  emiAmount: number;
  paidAmount: number;
  status: string;
  principalAmount: number;   // 👈 ADD
  interestAmount: number;    // 👈 ADD
}
export function generateFlatEmiSchedule(
  principal: number,
  annualRate: number,
  durationMonths: number,
  freq: CollectionFrequency,
  firstEmiDate: Date
) {
  const schedule: EmiScheduleItem[] = [];

  const installments = getTotalInstallments(durationMonths, freq);
  const totalInterest =
    principal * (annualRate / 100) * (durationMonths / 12);

  const totalPayable = principal + totalInterest;
  const emi = totalPayable / installments;

  const principalPerEmi = principal / installments;
  const interestPerEmi = totalInterest / installments;

  let currentDate = new Date(firstEmiDate);

  for (let i = 1; i <= installments; i++) {
    schedule.push({
      emiNumber: i,
      dueDate: new Date(currentDate),
      emiAmount: Math.round(emi * 100) / 100,
      principalAmount: Math.round(principalPerEmi * 100) / 100,
      interestAmount: Math.round(interestPerEmi * 100) / 100,
      paidAmount: 0,
      status: 'PENDING',
    });

    switch (freq) {
      case CollectionFrequency.WEEKLY:
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case CollectionFrequency.BIWEEKLY:
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case CollectionFrequency.MONTHLY:
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case CollectionFrequency.QUARTERLY:
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
    }
  }

  return schedule;
}

export function generateReducingEmiSchedule(
  principal: number,
  annualRate: number,
  durationMonths: number,
  freq: CollectionFrequency,
  firstEmiDate: Date
) {
  const schedule: EmiScheduleItem[] = [];

  const N = getPeriodsPerYear(freq);
  const r = annualRate / (100 * N);
  const n = getTotalInstallments(durationMonths, freq);

  const emi =
    (principal * r * Math.pow(1 + r, n)) /
    (Math.pow(1 + r, n) - 1);

  let remainingPrincipal = principal;
  let currentDate = new Date(firstEmiDate);

  for (let i = 1; i <= n; i++) {
    const interest = remainingPrincipal * r;
    const principalPart = emi - interest;

    remainingPrincipal -= principalPart;

    schedule.push({
      emiNumber: i,
      dueDate: new Date(currentDate),
      emiAmount: Math.round(emi * 100) / 100,
      principalAmount: Math.round(principalPart * 100) / 100,
      interestAmount: Math.round(interest * 100) / 100,
      paidAmount: 0,
      status: 'PENDING',
    });

    switch (freq) {
      case CollectionFrequency.WEEKLY:
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case CollectionFrequency.BIWEEKLY:
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case CollectionFrequency.MONTHLY:
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case CollectionFrequency.QUARTERLY:
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
    }
  }

  return schedule;
}

// export function generateEmiSchedule(
//   emi: number,
//   firstEmiDate: Date,
//   installments: number,
//   freq: CollectionFrequency
// ): EmiScheduleItem[] {
//   const schedule: EmiScheduleItem[] = [];  // Explicitly type the schedule array
//   let currentDate = new Date(firstEmiDate);

//   for (let i = 1; i <= installments; i++) {
//     schedule.push({
//       emiNumber: i,
//       dueDate: new Date(currentDate),
//       emiAmount: Math.round(emi * 100) / 100,
//       paidAmount: 0,
//       status: 'PENDING',
//     });

//     switch (freq) {
//       case CollectionFrequency.WEEKLY:
//         currentDate.setDate(currentDate.getDate() + 7);
//         break;
//       case CollectionFrequency.BIWEEKLY:
//         currentDate.setDate(currentDate.getDate() + 14);
//         break;
//       case CollectionFrequency.MONTHLY:
//         currentDate.setMonth(currentDate.getMonth() + 1);
//         break;
//       case CollectionFrequency.QUARTERLY:
//         currentDate.setMonth(currentDate.getMonth() + 3);
//         break;
//     }
//   }

//   return schedule;
// }

export function generateEmiSchedule(
  principal: number,
  annualRate: number,
  durationMonths: number,
  freq: CollectionFrequency,
  firstEmiDate: Date,
  interestType: InterestType
): EmiScheduleItem[] {

  const schedule: EmiScheduleItem[] = [];
  const N = getPeriodsPerYear(freq);
  const installments = getTotalInstallments(durationMonths, freq);

  let currentDate = new Date(firstEmiDate);

  // ======================
  // FLAT INTEREST LOGIC
  // ======================
  if (interestType === 'FLAT') {

    const totalInterest =
      principal * (annualRate / 100) * (durationMonths / 12);

    const totalPayable = principal + totalInterest;
    const emi = totalPayable / installments;

    const principalPerEmi = principal / installments;
    const interestPerEmi = totalInterest / installments;

    for (let i = 1; i <= installments; i++) {
      schedule.push({
        emiNumber: i,
        dueDate: new Date(currentDate),
        emiAmount: round(emi),
        principalAmount: round(principalPerEmi),
        interestAmount: round(interestPerEmi),
        paidAmount: 0,
        status: 'PENDING',
      });

      currentDate = incrementDate(currentDate, freq);
    }

    return schedule;
  }

  // ===========================
  // REDUCING BALANCE LOGIC
  // ===========================

  const r = annualRate / (100 * N);
  const n = installments;

  const emi =
    (principal * r * Math.pow(1 + r, n)) /
    (Math.pow(1 + r, n) - 1);

  let remainingPrincipal = principal;

  for (let i = 1; i <= n; i++) {

    const interest = remainingPrincipal * r;
    const principalPart = emi - interest;

    remainingPrincipal -= principalPart;

    schedule.push({
      emiNumber: i,
      dueDate: new Date(currentDate),
      emiAmount: round(emi),
      principalAmount: round(principalPart),
      interestAmount: round(interest),
      paidAmount: 0,
      status: 'PENDING',
    });

    currentDate = incrementDate(currentDate, freq);
  }

  return schedule;
}
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function incrementDate(date: Date, freq: CollectionFrequency): Date {
  const newDate = new Date(date);

  switch (freq) {
    case CollectionFrequency.WEEKLY:
      newDate.setDate(newDate.getDate() + 7);
      break;
    case CollectionFrequency.BIWEEKLY:
      newDate.setDate(newDate.getDate() + 14);
      break;
    case CollectionFrequency.MONTHLY:
      newDate.setMonth(newDate.getMonth() + 1);
      break;
    case CollectionFrequency.QUARTERLY:
      newDate.setMonth(newDate.getMonth() + 3);
      break;
  }

  return newDate;
}


export function calculateDisbursedAmount(
  principal: number,
  totalFees: number,
  method: FeesPaymentMethod
): number {
  if (method === 'DEDUCTED') {
    return principal - totalFees;
  }
  return principal;
}