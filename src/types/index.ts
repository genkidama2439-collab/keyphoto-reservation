export type Plan = {
  id: string;
  name: string;
  tag: string;
  catchCopy: string;
  priceAdult: number;
  priceChild?: number;
  priceLabel?: string; // プロポーズプランなど特殊表記用
  duration: string;
  includes: string[];
  notes?: string[];
  hideTransfer?: boolean; // 送迎オプション非表示フラグ
};

export type BookingFormData = {
  lineUserId: string;
  lineDisplayName: string;
  preferredDate: string;
  plan: string;
  transferOption: boolean;
  representativeName: string;
  numMale: number;
  numFemale: number;
  numChild: number;
  numInfant: number;
  phone: string;
  accommodation: string;
  stayFrom: string;
  stayTo: string;
  alternativeDate: string;
  instagram: string;
};
