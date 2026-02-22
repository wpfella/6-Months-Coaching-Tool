
export enum ReviewPeriodType {
  NINETY_DAYS = '90 Days',
  SIX_MONTHS = '6 Months',
  TWELVE_MONTHS = '12 Months'
}

export enum WeeklySpendingDay {
  MON = 'Mon',
  TUE = 'Tue',
  WED = 'Wed',
  THU = 'Thu',
  FRI = 'Fri',
  SAT = 'Sat',
  SUN = 'Sun'
}

export enum StepStatus {
  YES = 'YES',
  NO = 'NO',
  DISCRETION = 'AT YOUR DISCRETION'
}

// Added StatementRecord interface to fix import error in geminiService
export interface StatementRecord {
  base64Data?: string;
  mimeType?: string;
  prompt?: string;
}

export interface RedrawRecord {
  id: string;
  date: string;
  amount: number;
  description: string;
  excluded: boolean;
  month?: string; 
}

export interface FinancialGoal {
  id: string;
  goal: string;
  progress: number;
}

export interface MonthlyGranularData {
  month: string;
  debit: number;
  credit: number;
  loanBalance: number;
  oneOffDebitsRemoved: number;
  oneOffCreditsRemoved: number;
  redraws: number;
  actualDebtReduction: number;
  savingsRate: number;
}

export interface CoachingData {
  clientEmail: string;
  settlementDate: string;
  settlementLoanAmount: number;
  householdNames: string;
  propertyAddress: string;
  propertyImageUrl: string;
  startDate: string;
  endDate: string;
  originalDebtFreeDate: string;
  previousOODDate: string; 
  firstReportSavingsRate: number;
  previousBalance90Days: number;
  previousBalance6Months: number;
  previousLoan90Days: number; 
  previousLoan6Months: number; 

  monthlyData: MonthlyGranularData[];
  currentLoanBalance: number;
  currentAvailableRedraw: number;
  additionalRedraws: RedrawRecord[];
  uploadedStatements: any[]; 
  weeklySpendingAmount: number; 
  proposedWeeklySpendingAmount: number; 
  weeklySpendingDay: WeeklySpendingDay;
  hasExternalDebts: boolean;

  currentPropertyValuation: number;
  proposedFlexAmount: number;
  reviewPeriodType: ReviewPeriodType;
  
  recommendations: string[];
  closingThoughts: string;
  financialGoals: FinancialGoal[];
  
  rawRedrawsText: string;
  coachNotes: string;
  manualOverrides: Record<number, StepStatus>;
}

export interface CalculationResults {
  totalDebtReduction: number;
  avgMonthlyDebtReduction: number;
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  savingsRate: number;
  savingsRateSentence: string;
  totalAdditionalRedraws: number;
  avgMonthlyAdditionalRedraws: number;
  currentLVR: number;
  homeOwnership: {
    youOwn: number;
    bankOwns: number;
  };
  stepsStatus: Record<number, StepStatus>;
  currentDebtFreeDate: string;
  last6MonthsReduction: number;
  yearsSavedBase: number;
  moneySavedBase: number;
  yearsSavedFlex: number;
  moneySavedFlex: number;
  // Added to fix property access error in DashboardSection
  beatingPreviousPercent: number; 
}
