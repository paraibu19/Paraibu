export type MedicationType = "Paracetamol" | "Ibuprofen" | "None";

export interface DoseCalculation {
  paracetamol: {
    concentration: string;
    dose: number;
  };
  ibuprofen: {
    concentration: string;
    dose: number;
  };
}

export interface ScheduleItem {
  time: Date;
  medication: "Paracetamol" | "Ibuprofen";
  dose: number;
  unit: string;
}

export interface FormData {
  patientName: string;
  weight: number;
  previousMedication: MedicationType;
  paracetamolConcentration: string;
  ibuprofenConcentration: string;
}
