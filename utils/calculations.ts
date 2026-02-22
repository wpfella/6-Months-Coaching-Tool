
import { CoachingData, CalculationResults, StepStatus, ReviewPeriodType } from '../types';
import { format, addMonths, parseISO, differenceInMonths, differenceInYears } from 'date-fns';

export function performCalculations(data: CoachingData): CalculationResults {
  const openingBalance = data.monthlyData[0]?.loanBalance + (data.monthlyData[0]?.debit - data.monthlyData[0]?.credit) || data.previousBalance6Months;
  
  const totalDebtReduction = openingBalance - data.currentLoanBalance;
  const avgMonthlyDebtReduction = totalDebtReduction / Math.max(1, data.monthlyData.length);

  const actualIncome = data.monthlyData.reduce((sum, m) => sum + (m.credit - m.oneOffCreditsRemoved), 0);
  const actualExpenses = data.monthlyData.reduce((sum, m) => sum + (m.debit - m.oneOffDebitsRemoved), 0);

  const avgMonthlyIncome = actualIncome / Math.max(1, data.monthlyData.length);
  const avgMonthlyExpenses = actualExpenses / Math.max(1, data.monthlyData.length);

  const savingsRate = avgMonthlyIncome > 0 ? ((avgMonthlyIncome - avgMonthlyExpenses) / avgMonthlyIncome) * 100 : 0;
  const savedVal = Math.max(0, savingsRate);
  const savingsRateSentence = `For every $100 you earn, you save $${savedVal.toFixed(2)} and you spend $${(100 - savedVal).toFixed(2)}`;

  // Calculate beatingPreviousPercent based on improvement in savings rate from first report
  const beatingPreviousPercent = data.firstReportSavingsRate > 0 
    ? ((savingsRate - data.firstReportSavingsRate) / data.firstReportSavingsRate) * 100 
    : 0;

  const activeRedraws = data.additionalRedraws.filter(r => !r.excluded);
  const totalAdditionalRedraws = activeRedraws.reduce((sum, item) => sum + item.amount, 0);
  const avgMonthlyAdditionalRedraws = totalAdditionalRedraws / Math.max(1, data.monthlyData.length);

  const currentLVR = data.currentPropertyValuation > 0 ? (data.currentLoanBalance / data.currentPropertyValuation) * 100 : 0;
  const bankOwns = Math.min(100, currentLVR);
  const youOwn = 100 - bankOwns;

  const last6MonthsReduction = data.monthlyData.slice(-6).reduce((sum, m) => sum + (m.credit - m.debit - m.oneOffCreditsRemoved), 0);

  // 12 Steps Status
  const stepsStatus: Record<number, StepStatus> = {};
  stepsStatus[1] = data.currentAvailableRedraw >= 2000 ? StepStatus.YES : StepStatus.NO;
  stepsStatus[2] = data.currentAvailableRedraw >= avgMonthlyExpenses ? StepStatus.YES : StepStatus.NO;
  stepsStatus[3] = !data.hasExternalDebts ? StepStatus.YES : StepStatus.NO;
  stepsStatus[4] = data.currentAvailableRedraw >= (avgMonthlyExpenses * 3) ? StepStatus.YES : StepStatus.NO;
  stepsStatus[5] = data.currentLoanBalance <= (data.settlementLoanAmount * 0.9) ? StepStatus.YES : StepStatus.NO;
  stepsStatus[6] = StepStatus.DISCRETION;
  stepsStatus[7] = data.currentLoanBalance <= (data.settlementLoanAmount * 0.75) ? StepStatus.YES : StepStatus.NO;
  stepsStatus[8] = savingsRate >= (data.firstReportSavingsRate * 1.1) ? StepStatus.YES : StepStatus.NO;
  stepsStatus[9] = data.currentLoanBalance <= (data.settlementLoanAmount * 0.5) ? StepStatus.YES : StepStatus.NO;
  stepsStatus[10] = data.manualOverrides[10] || StepStatus.NO;
  stepsStatus[11] = data.currentLoanBalance <= (data.settlementLoanAmount * 0.25) ? StepStatus.YES : StepStatus.NO;
  stepsStatus[12] = data.currentLoanBalance <= 0 ? StepStatus.YES : StepStatus.NO;

  // Projections
  const standardMonthlyInterest = (data.currentLoanBalance * 0.06) / 12;
  const netMonthlyReductionBase = Math.max(1, avgMonthlyDebtReduction);
  const netMonthlyReductionFlex = Math.max(1, avgMonthlyDebtReduction + data.proposedFlexAmount);

  const monthsRemainingBase = data.currentLoanBalance / netMonthlyReductionBase;
  const monthsRemainingFlex = data.currentLoanBalance / netMonthlyReductionFlex;

  const currentDebtFreeDate = format(addMonths(new Date(), monthsRemainingBase), 'dd/MM/yyyy');

  // Compare to a 30-year standard loan
  const yearsSavedBase = Math.max(0, 30 - (monthsRemainingBase / 12));
  const moneySavedBase = Math.max(0, monthsRemainingBase * standardMonthlyInterest * 0.5); // Simplified interest saved heuristic

  const yearsSavedFlex = Math.max(0, 30 - (monthsRemainingFlex / 12));
  const moneySavedFlex = Math.max(0, monthsRemainingFlex * standardMonthlyInterest * 0.8);

  return {
    totalDebtReduction,
    avgMonthlyDebtReduction,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    savingsRate,
    savingsRateSentence,
    totalAdditionalRedraws,
    avgMonthlyAdditionalRedraws,
    currentLVR,
    homeOwnership: { youOwn, bankOwns },
    stepsStatus,
    currentDebtFreeDate,
    last6MonthsReduction,
    yearsSavedBase: Math.round(yearsSavedBase),
    moneySavedBase,
    yearsSavedFlex: Math.round(yearsSavedFlex),
    moneySavedFlex,
    beatingPreviousPercent
  };
}

export function modelCurvedOOD(
  balance: number, 
  monthlyRepaymentCapacity: number, 
  annualInterestRate: number = 0.06
): { points: { name: string, balance: number, year: number }[], monthsToZero: number } {
  const points = [];
  const monthlyRate = annualInterestRate / 12;
  let currentBalance = balance;
  let month = 0;

  while (currentBalance > 0 && month < 360) {
    if (month % 12 === 0) {
      points.push({ name: (month / 12).toString(), balance: Math.max(0, currentBalance), year: month / 12 });
    }
    const interestCharge = currentBalance * monthlyRate;
    const principalReduction = monthlyRepaymentCapacity - interestCharge;
    if (principalReduction <= 0) {
        // Loan will never be paid off at this rate
        for(let i=points.length; i<=30; i++) points.push({ name: i.toString(), balance: currentBalance, year: i });
        break;
    }; 
    currentBalance -= principalReduction;
    month++;
  }
  if (currentBalance <= 0) points.push({ name: (month / 12).toFixed(1), balance: 0, year: month / 12 });

  return { points, monthsToZero: month };
}
