export const mockArtisan = {
  id: "emeka-tailor",
  name: "Emeka Okafor",
  firstName: "Emeka",
  skill: "Tailor",
  skillEmoji: "✂️",
  city: "Surulere, Lagos",
  state: "Lagos",
  bio: "Master tailor with 12 years experience. Suits, agbada, dresses, alterations. Based in Surulere.",
  rating: 4.8,
  reviewCount: 23,
  craftScore: 741,
  craftScoreMax: 1000,
  scoreLevel: "Good Standing",
  totalEarned: 284500,
  thisMonth: 284500,
  lastMonth: 239500,
  transactionCount: 47,
  avgJobValue: 6053,
  repeatClients: 12,
  uniqueClients: 19,
  daysActive: 34,
  daysToScore: 60,
  paymentLink: "craftid.ng/pay/emeka-tailor",
  slug: "emeka-tailor",
  avatar: "https://i.pravatar.cc/150?u=emeka-okafor-tailor",
  loanOffer: {
    amount: 150000,
    minAmount: 50000,
    maxAmount: 150000,
    term: 6,
    rate: 3.5,
    monthlyRepayment: 29400,
    totalRepayment: 176400,
    status: "pre-approved" as const,
    expiresInDays: 6,
    purpose: "Equipment & Tools",
  },
  card: {
    last4: "4521",
    expiry: "03/28",
    limit: 150000,
    available: 150000,
    status: "active" as const,
    number: "5399 8300 0000 4521",
  },
  rateCard: [
    { service: "Trouser hem", price: 2000 },
    { service: "Dress alteration", price: 5000 },
    { service: "Kaftan", price: 18000 },
    { service: "Full agbada", price: 35000 },
    { service: "Three-piece suit", price: 55000 },
  ],
};

export const mockTransactions = [
  { id:"t1", clientName:"Ngozi Adeleke", initials:"NA", description:"Dress alteration", amount:5000, timestamp:"2 hours ago", color:"#F97316" },
  { id:"t2", clientName:"Taiwo Babatunde", initials:"TB", description:"Trouser hem × 2", amount:4000, timestamp:"5 hours ago", color:"#7C3AED" },
  { id:"t3", clientName:"Chisom Eze", initials:"CE", description:"Kaftan tailoring", amount:18000, timestamp:"Yesterday, 3pm", color:"#16A34A" },
  { id:"t4", clientName:"Amaka Obi", initials:"AO", description:"Full agbada", amount:35000, timestamp:"Yesterday, 11am", color:"#CA8A04" },
  { id:"t5", clientName:"Bayo Femi", initials:"BF", description:"Dress alteration", amount:5000, timestamp:"2 days ago", color:"#DB2777" },
  { id:"t6", clientName:"Kemi Rasheed", initials:"KR", description:"Three-piece suit", amount:55000, timestamp:"2 days ago", color:"#0891B2" },
  { id:"t7", clientName:"Yemi Shokunbi", initials:"YS", description:"Trouser hem", amount:2000, timestamp:"3 days ago", color:"#F97316" },
  { id:"t8", clientName:"Chidi Nwosu", initials:"CN", description:"Kaftan × 2", amount:36000, timestamp:"3 days ago", color:"#7C3AED" },
  { id:"t9", clientName:"Folake Akin", initials:"FA", description:"Dress alteration", amount:5000, timestamp:"4 days ago", color:"#16A34A" },
  { id:"t10", clientName:"Emeka Jude", initials:"EJ", description:"Full agbada × 2", amount:70000, timestamp:"4 days ago", color:"#CA8A04" },
  { id:"t11", clientName:"Aisha Mustapha", initials:"AM", description:"Trouser hem", amount:2000, timestamp:"5 days ago", color:"#DB2777" },
  { id:"t12", clientName:"Seun Kuti", initials:"SK", description:"Three-piece suit", amount:55000, timestamp:"5 days ago", color:"#0891B2" },
];

export const mockScoreHistory = Array.from({ length: 60 }, (_, i) => {
  const base = 320;
  const target = 741;
  const progress = i / 59;
  const eased = progress < 0.5 ? 2*progress*progress : 1 - Math.pow(-2*progress+2,2)/2;
  const noise = i > 5 ? Math.sin(i*0.8)*12 + Math.sin(i*1.3)*8 : 0;
  return {
    day: i + 1,
    score: Math.round(base + (target - base) * eased + noise),
  };
});

export const mockWeeklyIncome = [
  { day:"Mon", amount:27000 },
  { day:"Tue", amount:45000 },
  { day:"Wed", amount:12000 },
  { day:"Thu", amount:67000 },
  { day:"Fri", amount:89000 },
  { day:"Sat", amount:38000 },
  { day:"Sun", amount:6500 },
];

export const mockScoreFactors = [
  { name:"Payment Frequency", score:82, description:"You receive payments 5× per week on average" },
  { name:"Income Consistency", score:76, description:"Your income varies moderately week to week" },
  { name:"Transaction Growth", score:88, description:"You've grown 34% in the last 30 days" },
  { name:"Client Diversity", score:71, description:"12 unique clients in the last 60 days" },
];

export const formatNaira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
