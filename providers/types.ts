export interface NormalizedBusListing {
  provider: string; // "redBus" | "AbhiBus" | "ConfirmTkt" | "Paytm" | "MakeMyTrip" | "Goibibo"
  operatorName: string;
  departureTime: string; // e.g. "10:30 PM"
  arrivalTime: string;   // e.g. "06:15 AM"
  duration: string;      // e.g. "07h 45m"
  busType: string;       // e.g. "AC Sleeper"
  rating: number;        // e.g. 4.4
  price: number;         // e.g. 850
  seatsAvailable: number;
  boardingPoint: string;
  droppingPoint: string;
  redirectUrl: string;
  fetchedAt: string;     // ISO String
}
