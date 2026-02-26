export interface ConsultationFormData {
    // Applicant Info
    name: string;
    relation: string;
    phone: string;
    emergencyPhone: string;

    // Deceased Info
    deceasedName: string;
    deceasedGender: string;
    deceasedLocation: string;
    deathCause: string;

    // Transport Info
    isAmbulanceNeeded: string;
    departureLocation: string;

    // Preferences (Funeral)
    region: string;
    scale: string;
    religion: string;
    funeralMethod: string;
    burialMethod: string;

    // Common / Legacy
    time: string;
    type: string;
    location: string;

    // Pet Specific
    petName: string;
    petType: string;
    weight: string;
    isStone: boolean;
    date: string;
    requests: string;

    // Memorial Specific
    memorialType: string;
    urnCount: string;
    deathDate: string;
    visitDate: string;
    memorialBudget: string;
}
