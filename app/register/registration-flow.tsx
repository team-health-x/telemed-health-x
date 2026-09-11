"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  Languages,
  LockKeyhole,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react";

type RegistrationData = {
  documentType: "thai_id" | "passport";
  documentNumber: string;
  title: string;
  firstName: string;
  lastName: string;
  nickname: string;
  firstNameEn: string;
  lastNameEn: string;
  birthDate: string;
  yearEra: "be";
  height: string;
  startWeight: string;
  gender: string;
  nationality: string;
  race: string;
  maritalStatus: string;
  primaryPhone: string;
  alternatePhone: string;
  email: string;
  lineId: string;
  preferredLanguage: string;
  preferredChannel: string;
  docHouseNo: string;
  docBuilding: string;
  docMoo: string;
  docSoi: string;
  docRoad: string;
  docSubdistrict: string;
  docDistrict: string;
  docProvince: string;
  docPostalCode: string;
  docCountry: string;
  docFullAddress: string;
  sameAddress: boolean;
  currentHouseNo: string;
  currentBuilding: string;
  currentMoo: string;
  currentSoi: string;
  currentRoad: string;
  currentSubdistrict: string;
  currentDistrict: string;
  currentProvince: string;
  currentPostalCode: string;
  currentCountry: string;
  currentFullAddress: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyNote: string;
};

export type RegisteredProfile = {
  name: string;
  phone: string;
  birthDate: string;
  height: string;
  startWeight: string;
  healthHistory: string;
  allergyHistory: string;
  address: string;
  email: string;
};

type HealthStatus = "" | "none" | "yes" | "unknown";
type HealthEntry = {
  status: HealthStatus;
  details: string;
  drugName: string;
  reaction: string;
  severity: string;
  approximateDate: string;
  note: string;
};

type HealthKey =
  | "drugAllergy"
  | "otherAllergy"
  | "chronicDisease"
  | "regularMedication"
  | "surgery"
  | "hospitalization"
  | "majorTreatment"
  | "pregnancy"
  | "breastfeeding"
  | "pregnancyPlan";

type HealthData = Record<HealthKey, HealthEntry>;
type Errors = Record<string, string>;
type ConsentData = {
  accurate: boolean;
  personalData: boolean;
  privacy: boolean;
  treatmentContact: boolean;
  marketing: boolean;
};
type IdentityMedia = { idCard: string; selfieWithCard: string };

const CONSENT_DOCUMENT_VERSION = "PR-REG-CONSENT v1.0";
const MOCK_OTP = "123456";

const initialForm: RegistrationData = {
  documentType: "thai_id",
  documentNumber: "1234567890121",
  title: "นางสาว",
  firstName: "พิมพ์ชนก",
  lastName: "วัฒนากุล",
  nickname: "พิม",
  firstNameEn: "Pimchanok",
  lastNameEn: "Wattanakul",
  birthDate: "1991-05-18",
  yearEra: "be",
  height: "165",
  startWeight: "78.4",
  gender: "หญิง",
  nationality: "ไทย",
  race: "ไทย",
  maritalStatus: "โสด",
  primaryPhone: "0812345678",
  alternatePhone: "0898765432",
  email: "pimchanok@example.com",
  lineId: "pim.resize.demo",
  preferredLanguage: "ไทย",
  preferredChannel: "LINE",
  docHouseNo: "99/9",
  docBuilding: "ริทซ์ เรสซิเดนซ์",
  docMoo: "",
  docSoi: "สุขุมวิท 49",
  docRoad: "สุขุมวิท",
  docSubdistrict: "คลองตันเหนือ",
  docDistrict: "วัฒนา",
  docProvince: "กรุงเทพมหานคร",
  docPostalCode: "10110",
  docCountry: "ประเทศไทย",
  docFullAddress: "99/9 ริทซ์ เรสซิเดนซ์ ซอยสุขุมวิท 49 ถนนสุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
  sameAddress: true,
  currentHouseNo: "99/9",
  currentBuilding: "ริทซ์ เรสซิเดนซ์",
  currentMoo: "",
  currentSoi: "สุขุมวิท 49",
  currentRoad: "สุขุมวิท",
  currentSubdistrict: "คลองตันเหนือ",
  currentDistrict: "วัฒนา",
  currentProvince: "กรุงเทพมหานคร",
  currentPostalCode: "10110",
  currentCountry: "ประเทศไทย",
  currentFullAddress: "99/9 ริทซ์ เรสซิเดนซ์ ซอยสุขุมวิท 49 ถนนสุขุมวิท แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร 10110",
  emergencyName: "กานดา วัฒนากุล",
  emergencyRelationship: "มารดา",
  emergencyPhone: "0865432109",
  emergencyNote: "สะดวกให้ติดต่อช่วงเวลา 09:00–18:00 น.",
};

const emptyHealth: HealthEntry = {
  status: "",
  details: "",
  drugName: "",
  reaction: "",
  severity: "",
  approximateDate: "",
  note: "",
};

const healthTopics: { key: HealthKey; label: string; hint: string }[] = [
  { key: "drugAllergy", label: "ประวัติแพ้ยา", hint: "รวมยาฉีด ยารับประทาน และยาทาภายนอก" },
  { key: "otherAllergy", label: "แพ้อาหารหรือสารอื่น", hint: "เช่น อาหาร ยางลาเท็กซ์ หรือสารทึบรังสี" },
  { key: "chronicDisease", label: "โรคประจำตัว", hint: "ระบุโรคที่อยู่ระหว่างการรักษาหรือติดตาม" },
  { key: "regularMedication", label: "ยา วิตามิน หรืออาหารเสริมที่ใช้ประจำ", hint: "รวมผลิตภัณฑ์ที่ซื้อรับประทานเอง" },
  { key: "surgery", label: "ประวัติผ่าตัด", hint: "ระบุชนิดและช่วงเวลาที่ผ่าตัด" },
  { key: "hospitalization", label: "ประวัตินอนโรงพยาบาล", hint: "ระบุสาเหตุและช่วงเวลาโดยประมาณ" },
  { key: "majorTreatment", label: "ประวัติการรักษาสำคัญ", hint: "เช่น มะเร็ง โรคหัวใจ หรือการรักษาต่อเนื่อง" },
  { key: "pregnancy", label: "การตั้งครรภ์", hint: "เลือกสถานะที่ตรงกับปัจจุบัน" },
  { key: "breastfeeding", label: "ให้นมบุตร", hint: "เลือกสถานะที่ตรงกับปัจจุบัน" },
  { key: "pregnancyPlan", label: "วางแผนตั้งครรภ์", hint: "รวมแผนในช่วง 12 เดือนข้างหน้า" },
];

const mockHealth: Partial<Record<HealthKey, Partial<HealthEntry>>> = {
  chronicDisease: { status: "yes", details: "ไขมันในเลือดสูง อยู่ระหว่างติดตามอาการกับแพทย์" },
  regularMedication: { status: "yes", details: "วิตามินดี วันละ 1 เม็ด หลังอาหารเช้า" },
};

const initialHealth = Object.fromEntries(
  healthTopics.map(({ key }) => [key, { ...emptyHealth, status: "none", ...mockHealth[key] }]),
) as HealthData;

function formatAddress(form: RegistrationData, current: boolean) {
  const prefix = current ? "current" : "doc";
  const fullAddress = form[`${prefix}FullAddress` as keyof RegistrationData];
  if (typeof fullAddress === "string" && fullAddress.trim()) return fullAddress.trim();

  const keys = ["HouseNo", "Building", "Moo", "Soi", "Road", "Subdistrict", "District", "Province", "PostalCode", "Country"];
  return keys
    .map((key) => form[`${prefix}${key}` as keyof RegistrationData])
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .join(" ");
}

function buildRegisteredProfile(form: RegistrationData, health: HealthData): RegisteredProfile {
  const healthHistory = healthTopics.flatMap(({ key, label }) => {
    const entry = health[key];
    if (entry.status !== "yes") return [];
    if (key === "drugAllergy") {
      const reaction = entry.reaction ? ` (${entry.reaction})` : "";
      return [`${label}: ${entry.drugName}${reaction}`];
    }
    return [`${label}: ${entry.details}`];
  });
  const allergyHistory = (["drugAllergy", "otherAllergy"] as const).flatMap((key) => {
    const entry = health[key];
    const label = key === "drugAllergy" ? "แพ้ยา" : "แพ้อาหารหรือสารอื่น";
    if (entry.status === "unknown") return [`${label}: ยังไม่ทราบ`];
    if (entry.status !== "yes") return [];
    if (key === "drugAllergy") return [`${label}: ${entry.drugName}${entry.reaction ? ` — ${entry.reaction}` : ""}`];
    return [`${label}: ${entry.details}`];
  });

  return {
    name: `${form.firstName} ${form.lastName}`.trim(),
    phone: form.primaryPhone,
    birthDate: form.birthDate,
    height: form.height,
    startWeight: form.startWeight,
    healthHistory: healthHistory.length ? healthHistory.join(" • ") : "ไม่มีประวัติสุขภาพที่ต้องแจ้ง",
    allergyHistory: allergyHistory.length ? allergyHistory.join(" • ") : "ไม่มีประวัติการแพ้ยา อาหาร หรือสารอื่น",
    address: form.sameAddress ? formatAddress(form, false) : formatAddress(form, true),
    email: form.email,
  };
}

const steps = [
  { title: "ข้อมูลส่วนตัว", description: "กรอกข้อมูลให้ตรงกับเอกสารประจำตัว" },
  { title: "ที่อยู่และข้อมูลติดต่อ", description: "ระบุข้อมูลที่คลินิกใช้สำหรับติดต่อและจัดทำประวัติ" },
  { title: "ผู้ติดต่อกรณีฉุกเฉิน", description: "ใช้เฉพาะกรณีจำเป็นเกี่ยวกับการรักษาหรือความปลอดภัย" },
  { title: "ข้อมูลสุขภาพสำคัญ", description: "ข้อมูลนี้ช่วยให้คลินิกให้บริการได้อย่างปลอดภัย" },
  { title: "ตรวจสอบข้อมูลก่อนส่ง", description: "ตรวจสอบข้อมูลและยืนยันความยินยอมก่อนส่งให้คลินิก" },
];

const currentAddressMap: Partial<Record<keyof RegistrationData, keyof RegistrationData>> = {
  docHouseNo: "currentHouseNo",
  docBuilding: "currentBuilding",
  docMoo: "currentMoo",
  docSoi: "currentSoi",
  docRoad: "currentRoad",
  docSubdistrict: "currentSubdistrict",
  docDistrict: "currentDistrict",
  docProvince: "currentProvince",
  docPostalCode: "currentPostalCode",
  docCountry: "currentCountry",
  docFullAddress: "currentFullAddress",
};

function isValidThaiId(value: string) {
  if (!/^\d{13}$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const sum = digits.slice(0, 12).reduce((total, digit, index) => total + digit * (13 - index), 0);
  return (11 - (sum % 11)) % 10 === digits[12];
}

function validateStep(step: number, form: RegistrationData, health: HealthData): Errors {
  const next: Errors = {};
  const required = (key: keyof RegistrationData, message: string) => {
    if (typeof form[key] === "string" && !form[key].trim()) next[String(key)] = message;
  };

  if (step === 1) {
    required("documentNumber", form.documentType === "thai_id" ? "กรุณากรอกเลขบัตรประชาชน" : "กรุณากรอกเลข Passport");
    if (form.documentNumber) {
      if (form.documentType === "thai_id" && !isValidThaiId(form.documentNumber)) next.documentNumber = "เลขบัตรประชาชนไม่ถูกต้อง";
      if (form.documentType === "passport" && !/^[A-Z0-9]{6,12}$/i.test(form.documentNumber)) next.documentNumber = "เลข Passport ไม่ถูกต้อง";
    }
    required("title", "กรุณาเลือกคำนำหน้า");
    required("firstName", "กรุณากรอกชื่อ");
    required("lastName", "กรุณากรอกนามสกุล");
    required("birthDate", "กรุณาระบุวันเดือนปีเกิด");
    if (form.birthDate && new Date(`${form.birthDate}T00:00:00`) > new Date()) next.birthDate = "วันเกิดต้องไม่เป็นวันที่ในอนาคต";
    required("gender", "กรุณาระบุเพศ");
    required("nationality", "กรุณาระบุสัญชาติ");
  }

  if (step === 2) {
    required("primaryPhone", "กรุณากรอกเบอร์โทรศัพท์หลัก");
    if (form.primaryPhone && !/^0\d{9}$/.test(form.primaryPhone)) next.primaryPhone = "เบอร์โทรไทยต้องมี 10 หลัก";
    if (form.alternatePhone && !/^0\d{9}$/.test(form.alternatePhone)) next.alternatePhone = "เบอร์โทรไทยต้องมี 10 หลัก";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "รูปแบบอีเมลไม่ถูกต้อง";
    required("docHouseNo", "กรุณากรอกบ้านเลขที่");
    required("docSubdistrict", "กรุณากรอกแขวง/ตำบล");
    required("docDistrict", "กรุณากรอกเขต/อำเภอ");
    required("docProvince", "กรุณากรอกจังหวัด");
    required("docPostalCode", "กรุณากรอกรหัสไปรษณีย์");
    if (form.docPostalCode && !/^\d{5}$/.test(form.docPostalCode)) next.docPostalCode = "รหัสไปรษณีย์ต้องมี 5 หลัก";
    required("docCountry", "กรุณาระบุประเทศ");
    if (!form.sameAddress) {
      required("currentHouseNo", "กรุณากรอกบ้านเลขที่ปัจจุบัน");
      required("currentSubdistrict", "กรุณากรอกแขวง/ตำบลปัจจุบัน");
      required("currentDistrict", "กรุณากรอกเขต/อำเภอปัจจุบัน");
      required("currentProvince", "กรุณากรอกจังหวัดปัจจุบัน");
      required("currentPostalCode", "กรุณากรอกรหัสไปรษณีย์ปัจจุบัน");
      if (form.currentPostalCode && !/^\d{5}$/.test(form.currentPostalCode)) next.currentPostalCode = "รหัสไปรษณีย์ต้องมี 5 หลัก";
    }
  }

  if (step === 3) {
    required("emergencyName", "กรุณากรอกชื่อ–นามสกุลผู้ติดต่อฉุกเฉิน");
    required("emergencyPhone", "กรุณากรอกเบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน");
    if (form.emergencyPhone && !/^0\d{9}$/.test(form.emergencyPhone)) next.emergencyPhone = "เบอร์โทรไทยต้องมี 10 หลัก";
  }

  if (step === 4) {
    required("height", "กรุณากรอกส่วนสูง");
    required("startWeight", "กรุณากรอกน้ำหนักตั้งต้น");
    const height = Number(form.height);
    const startWeight = Number(form.startWeight);
    if (form.height && (!Number.isFinite(height) || height < 100 || height > 250)) next.height = "กรุณากรอกส่วนสูง 100–250 ซม.";
    if (form.startWeight && (!Number.isFinite(startWeight) || startWeight < 30 || startWeight > 350)) next.startWeight = "กรุณากรอกน้ำหนัก 30–350 กก.";
    healthTopics.forEach(({ key, label }) => {
      const entry = health[key];
      if (!entry.status) next[`health.${key}.status`] = `กรุณาตอบหัวข้อ ${label}`;
      if (entry.status === "yes") {
        if (key === "drugAllergy") {
          if (!entry.drugName.trim()) next[`health.${key}.drugName`] = "กรุณาระบุชื่อยาที่แพ้";
          if (!entry.reaction.trim()) next[`health.${key}.reaction`] = "กรุณาระบุอาการแพ้";
          if (!entry.severity) next[`health.${key}.severity`] = "กรุณาระดับความรุนแรง";
        } else if (!entry.details.trim()) {
          next[`health.${key}.details`] = "กรุณาระบุรายละเอียด";
        }
      }
    });
  }

  return next;
}

export default function RegistrationFlow({ onComplete }: { onComplete: (profile: RegisteredProfile) => void }) {
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState<"th" | "en">("th");
  const [form, setForm] = useState<RegistrationData>(initialForm);
  const [health, setHealth] = useState<HealthData>(initialHealth);
  const [identityMedia, setIdentityMedia] = useState<IdentityMedia>({ idCard: "", selfieWithCard: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [consents, setConsents] = useState<ConsentData>({ accurate: false, personalData: false, privacy: false, treatmentContact: false, marketing: false });
  const [signatureData, setSignatureData] = useState("");
  const [signerIntent, setSignerIntent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [signupProof, setSignupProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const submitPending = useRef(false);
  const [signaturePadVersion, setSignaturePadVersion] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [evidenceHash, setEvidenceHash] = useState("");

  const allStepsValid = useMemo(
    () => [1, 2, 3, 4].every((index) => Object.keys(validateStep(index, form, health)).length === 0),
    [form, health],
  );
  const requiredConsents = consents.accurate && consents.personalData && consents.privacy && consents.treatmentContact;
  const canSubmit = allStepsValid && requiredConsents && otpVerified && signerIntent && Boolean(signatureData);

  function updateForm<K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) {
    if (key === "documentNumber" || key === "primaryPhone") {
      setOtpVerified(false);
      setSignatureData("");
      setSignerIntent(false);
      setSignaturePadVersion((current) => current + 1);
    }
    setForm((previous) => {
      const next = { ...previous, [key]: value };
      const currentKey = currentAddressMap[key];
      if (previous.sameAddress && currentKey && typeof value === "string") {
        (next[currentKey] as string) = value;
      }
      if (key === "sameAddress" && value === true) {
        Object.entries(currentAddressMap).forEach(([docKey, destination]) => {
          if (destination) (next[destination] as string) = String(next[docKey as keyof RegistrationData] ?? "");
        });
      }
      return next;
    });
    setErrors((previous) => {
      const next = { ...previous };
      delete next[String(key)];
      return next;
    });
  }

  function updateHealth(key: HealthKey, field: keyof HealthEntry, value: string) {
    setHealth((previous) => ({ ...previous, [key]: { ...previous[key], [field]: value } }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next[`health.${key}.${field}`];
      return next;
    });
  }

  function goNext() {
    const nextErrors = validateStep(step, form, health);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStep((current) => Math.min(5, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (step > 1) {
      setStep((current) => current - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submitRegistration() {
    if (!canSubmit || submitPending.current) return;
    submitPending.current = true; setSubmitting(true); setSubmitError('');
    try {
    let proof = signupProof;
    if (!proof) {
      const sent = await fetch('/api/telemed/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: form.primaryPhone }) });
      const challenge = await sent.json();
      if (!sent.ok) throw new Error('ระบบบันทึกสมัครยังไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง');
      const verified = await fetch('/api/telemed/auth/verify-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: form.primaryPhone, challengeId: challenge.challengeId, code: MOCK_OTP }) });
      const verification = await verified.json();
      if (!verified.ok) throw new Error(verification.error || 'ยืนยันการสมัครไม่สำเร็จ');
      proof = verification.proof;
      setSignupProof(proof);
    }
    const submittedDate = new Date();
    const profile = buildRegisteredProfile(form, health);
    const acceptedAt = submittedDate.toISOString();
    const consent = (accepted: boolean) => ({ accepted, acceptedAt, version: CONSENT_DOCUMENT_VERSION });
    const response = await fetch('/api/telemed/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proof, signup: {
      title: form.title, name: form.firstName, lastname: form.lastName, nickname: form.nickname,
      gender: form.gender === 'หญิง' ? 'Female' : form.gender === 'ชาย' ? 'Male' : 'Other', birthDate: form.birthDate,
      preferredLanguage: form.preferredLanguage === 'ไทย' ? 'th' : 'en',
      identity: { type: form.documentType, number: form.documentNumber }, phoneNumber: form.primaryPhone,
      secondPhoneNumber: form.alternatePhone || undefined, email: form.email || undefined, lineId: form.lineId,
      statusMarry: form.maritalStatus, address: profile.address,
      subDistrict: form.sameAddress ? form.docSubdistrict : form.currentSubdistrict,
      district: form.sameAddress ? form.docDistrict : form.currentDistrict,
      province: form.sameAddress ? form.docProvince : form.currentProvince,
      postcode: form.sameAddress ? form.docPostalCode : form.currentPostalCode,
      consents: { pdpa: consent(consents.personalData && consents.privacy), medical: consent(consents.treatmentContact), marketing: consent(consents.marketing) },
      customerInfo: { height: Number(form.height), weight: Number(form.startWeight), allergy: [profile.allergyHistory], otherImportant: [profile.healthHistory], emergencyContactName: form.emergencyName, emergencyContactPhone: form.emergencyPhone, emergencyContactRelation: form.emergencyRelationship },
      telemedDetails: { form, health, consents, consentVersion: CONSENT_DOCUMENT_VERSION, signedAt: acceptedAt, signerIntent, signatureData, identityMedia },
    } }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'สมัครไม่สำเร็จ');
    window.location.replace('/register');
    } catch (error) { setSubmitError(error instanceof Error ? error.message : 'สมัครไม่สำเร็จ'); }
    finally { submitPending.current = false; setSubmitting(false); }
  }

  if (submitted) {
    return <SuccessScreen submittedAt={submittedAt} evidenceId={evidenceId} evidenceHash={evidenceHash} onComplete={() => onComplete(buildRegisteredProfile(form, health))} />;
  }

  return (
    <main className="app-shell registration-shell">
      <header className="registration-header">
        <div className="registration-topline">
          <div className="brand-lockup" aria-label="Program Resize by The Ritz Clinic">
            <img className="brand-logo program-resize-logo" src="/program-resize-logo.png" alt="Program Resize" />
            <span className="brand-divider" aria-hidden="true" />
            <img className="brand-logo ritz-logo" src="/the-ritz-clinic-logo.png" alt="The Ritz Clinic" />
          </div>
          <button className="language-toggle" type="button" onClick={() => setLanguage((value) => value === "th" ? "en" : "th")}>
            <Languages size={16} aria-hidden="true" /> {language === "th" ? "EN" : "ไทย"}
          </button>
        </div>
        <div className="step-meta"><span>{language === "th" ? `ขั้นตอนที่ ${step} จาก 5` : `Step ${step} of 5`}</span><strong>{Math.round((step / 5) * 100)}%</strong></div>
        <div className="registration-progress" aria-label={`ความคืบหน้า ${step} จาก 5 ขั้นตอน`}><span style={{ width: `${step * 20}%` }} /></div>
        <p className="eyebrow">CUSTOMER REGISTRATION</p>
        <h1>{steps[step - 1].title}</h1>
        <p>{steps[step - 1].description}</p>
      </header>

      <section className="registration-content">
        {process.env.NODE_ENV === 'development' && <p role="status">โหมด Dev: การส่งแบบฟอร์มจะบันทึกลูกค้าในระบบทดสอบ</p>}
        {step === 1 && <PersonalStep form={form} errors={errors} identityMedia={identityMedia} onIdentityMedia={setIdentityMedia} update={updateForm} />}
        {step === 2 && <ContactStep form={form} errors={errors} update={updateForm} />}
        {step === 3 && <EmergencyStep form={form} errors={errors} update={updateForm} />}
        {step === 4 && <HealthStep form={form} health={health} errors={errors} updateForm={updateForm} updateHealth={updateHealth} />}
        {step === 5 && (
          <ReviewStep
            form={form}
            health={health}
            identityMedia={identityMedia}
            consents={consents}
            requiredConsents={requiredConsents}
            otpVerified={otpVerified}
            onSignupProof={setSignupProof}
            onOtpVerified={(value) => {
              setOtpVerified(value);
              if (!value) {
                setSignatureData("");
                setSignaturePadVersion((current) => current + 1);
              }
            }}
            signerIntent={signerIntent}
            onSignerIntent={(value) => {
              setSignerIntent(value);
              if (!value) {
                setSignatureData("");
                setSignaturePadVersion((current) => current + 1);
              }
            }}
            signaturePadVersion={signaturePadVersion}
            onConsent={(key, value) => {
              setConsents((previous) => ({ ...previous, [key]: value }));
              setSignatureData("");
              setSignerIntent(false);
              setSignaturePadVersion((current) => current + 1);
            }}
            onEdit={(target) => {
              setSignatureData("");
              setSignerIntent(false);
              setSignaturePadVersion((current) => current + 1);
              setStep(target);
              setErrors({});
              window.scrollTo({ top: 0 });
            }}
            onSignatureChange={setSignatureData}
          />
        )}
      </section>

      <footer className="registration-footer">
        <button className="registration-back" type="button" disabled={step === 1} onClick={goBack}><ArrowLeft size={17} aria-hidden="true" />ย้อนกลับ</button>
        {step < 5 ? (
          <button className="registration-next" type="button" onClick={goNext}>ถัดไป<ArrowRight size={17} aria-hidden="true" /></button>
        ) : (
          <button className="registration-next" type="button" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}>ส่งแบบฟอร์ม<Check size={17} aria-hidden="true" /></button>
        )}
      </footer>

      {confirmOpen && (
        <div className="confirmation-backdrop" role="presentation" onMouseDown={(event) => !submitting && event.currentTarget === event.target && setConfirmOpen(false)}>
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="confirmation-close" type="button" disabled={submitting} aria-label="ปิด" onClick={() => setConfirmOpen(false)}><X size={18} aria-hidden="true" /></button>
            <span><ShieldCheck size={25} aria-hidden="true" /></span>
            <h2 id="confirm-title">ยืนยันส่งข้อมูลให้คลินิกหรือไม่</h2>
            <p>หลังส่งแล้วคุณจะไม่สามารถแก้ไขข้อมูลได้เอง กรุณาตรวจสอบข้อมูลอีกครั้งก่อนยืนยัน</p>
            {submitError && <p role="alert" className="field-error">{submitError}</p>}
            <div><button type="button" disabled={submitting} onClick={() => setConfirmOpen(false)}>กลับไปตรวจสอบ</button><button type="button" disabled={submitting} onClick={submitRegistration}>{submitting ? 'กำลังบันทึก...' : 'ยืนยันส่งข้อมูล'}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}

function PersonalStep({ form, errors, identityMedia, onIdentityMedia, update }: StepProps & { identityMedia: IdentityMedia; onIdentityMedia: React.Dispatch<React.SetStateAction<IdentityMedia>> }) {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">(identityMedia.idCard ? "done" : "idle");
  const [captureMode, setCaptureMode] = useState<keyof IdentityMedia | null>(null);

  function saveCapturedImage(field: keyof IdentityMedia, image: string) {
    if (field === "idCard") setScanState("scanning");
    onIdentityMedia((current) => ({ ...current, [field]: image }));
    setCaptureMode(null);
    if (field === "idCard") {
      window.setTimeout(() => {
        update("documentType", "thai_id");
        update("documentNumber", "1234567890121");
        update("title", "นางสาว");
        update("firstName", "พิมพ์ชนก");
        update("lastName", "วัฒนากุล");
        update("firstNameEn", "Pimchanok");
        update("lastNameEn", "Wattanakul");
        update("birthDate", "1991-05-18");
        update("gender", "หญิง");
        update("nationality", "ไทย");
        setScanState("done");
      }, 650);
    }
  }

  return (
    <div className="form-section">
      <SectionTitle title="ยืนยันตัวตน" detail="สแกนบัตรเพื่อเติมข้อมูลอัตโนมัติ แล้วถ่ายรูปคู่บัตรเพื่อยืนยันว่าเป็นเจ้าของบัตร" />
      <div className="identity-capture-grid">
        <button type="button" className={`identity-capture-card ${identityMedia.idCard ? "complete" : ""} ${scanState === "scanning" ? "scanning" : ""}`} onClick={() => setCaptureMode("idCard")}>
          <span className="identity-step">1</span>
          <div className="identity-preview">{identityMedia.idCard ? <img src={identityMedia.idCard} alt="ภาพบัตรประชาชนที่สแกน" /> : <ScanLine size={29} strokeWidth={2.1} aria-hidden="true" />}</div>
          <strong>{scanState === "scanning" ? "กำลังอ่านข้อมูล..." : identityMedia.idCard ? "อ่านบัตรสำเร็จ" : "สแกนบัตรประชาชน"}</strong>
          <small>{identityMedia.idCard ? "แตะเพื่อถ่ายใหม่" : "ใช้กล้องหลังหรือเลือกรูปจากเครื่อง"}</small>
          {identityMedia.idCard && scanState === "done" && <i><Check size={12} strokeWidth={3} aria-hidden="true" />ดึงข้อมูลแล้ว</i>}
        </button>
        <button type="button" className={`identity-capture-card selfie ${identityMedia.selfieWithCard ? "complete" : ""}`} onClick={() => setCaptureMode("selfieWithCard")}>
          <span className="identity-step">2</span>
          <div className="identity-preview">{identityMedia.selfieWithCard ? <img src={identityMedia.selfieWithCard} alt="ภาพถ่ายผู้ลงทะเบียนคู่บัตรประชาชน" /> : <Camera size={29} strokeWidth={2.1} aria-hidden="true" />}</div>
          <strong>{identityMedia.selfieWithCard ? "ถ่ายรูปเรียบร้อย" : "ถ่ายรูปคู่บัตร"}</strong>
          <small>{identityMedia.selfieWithCard ? "แตะเพื่อถ่ายใหม่" : "เห็นใบหน้าและหน้าบัตรชัดเจน"}</small>
          {identityMedia.selfieWithCard && <i><Check size={12} strokeWidth={3} aria-hidden="true" />พร้อมใช้งาน</i>}
        </button>
      </div>
      <div className="identity-privacy"><ShieldCheck size={17} strokeWidth={2.3} aria-hidden="true" /><p><strong>ใช้เพื่อยืนยันตัวตนและสร้าง HN เท่านั้น</strong><small>ภาพจะไม่ถูกนำไปใช้เพื่อการตลาด</small></p></div>

      {captureMode && <IdentityCameraCapture mode={captureMode} onClose={() => setCaptureMode(null)} onCapture={(image) => saveCapturedImage(captureMode, image)} />}

      <div className="identity-data-heading"><div><p className="eyebrow">ข้อมูลจากบัตร</p><h2>ตรวจสอบข้อมูลให้ถูกต้อง</h2></div>{scanState === "done" && <span><Check size={13} strokeWidth={3} aria-hidden="true" />เติมอัตโนมัติแล้ว</span>}</div>
      <div className="form-grid identity-document-fields">
        <SelectField label="ประเภทเอกสาร" required value={form.documentType} options={[{ value: "thai_id", label: "บัตรประชาชน" }, { value: "passport", label: "Passport" }]} onChange={(value) => update("documentType", value as RegistrationData["documentType"])} />
        <Field label={form.documentType === "thai_id" ? "เลขบัตรประชาชน" : "เลข Passport"} required error={errors.documentNumber}><input inputMode={form.documentType === "thai_id" ? "numeric" : "text"} maxLength={form.documentType === "thai_id" ? 13 : 12} value={form.documentNumber} onChange={(event) => update("documentNumber", event.target.value.toUpperCase().replace(form.documentType === "thai_id" ? /\D/g : /[^A-Z0-9]/g, ""))} placeholder={form.documentType === "thai_id" ? "กรอกตัวเลข 13 หลัก" : "เช่น AA123456"} /></Field>
      </div>

      <SectionTitle title="ข้อมูลส่วนตัว" detail="ข้อมูลส่วนนี้เติมจากบัตรแล้ว คุณสามารถตรวจสอบและแก้ไขได้" />
      <div className="form-grid">
        <SelectField label="คำนำหน้า" required error={errors.title} value={form.title} placeholder="เลือกคำนำหน้า" options={["นาย", "นาง", "นางสาว", "ไม่ระบุ"].map((value) => ({ value, label: value }))} onChange={(value) => update("title", value)} />
        <Field label="ชื่อเล่น"><input value={form.nickname} onChange={(event) => update("nickname", event.target.value)} /></Field>
        <Field label="ชื่อ" required error={errors.firstName}><input value={form.firstName} onChange={(event) => update("firstName", event.target.value)} /></Field>
        <Field label="นามสกุล" required error={errors.lastName}><input value={form.lastName} onChange={(event) => update("lastName", event.target.value)} /></Field>
        <Field label="ชื่อภาษาอังกฤษ"><input value={form.firstNameEn} onChange={(event) => update("firstNameEn", event.target.value)} /></Field>
        <Field label="นามสกุลภาษาอังกฤษ"><input value={form.lastNameEn} onChange={(event) => update("lastNameEn", event.target.value)} /></Field>
        <Field label="วันเดือนปีเกิด" required error={errors.birthDate}><input type="date" value={form.birthDate} onChange={(event) => update("birthDate", event.target.value)} /></Field>
        <Field label="รูปแบบปี"><div className="locked-form-value" aria-label="รูปแบบปี พ.ศ. ล็อกไว้"><span>พ.ศ.</span><LockKeyhole size={15} strokeWidth={2.3} aria-hidden="true" /></div></Field>
        <SelectField label="เพศ" required error={errors.gender} value={form.gender} placeholder="เลือกเพศ" options={["หญิง", "ชาย", "ไม่ระบุ", "อื่นๆ"].map((value) => ({ value, label: value }))} onChange={(value) => update("gender", value)} />
        <Field label="สัญชาติ" required error={errors.nationality}><input value={form.nationality} onChange={(event) => update("nationality", event.target.value)} /></Field>
        <Field label="เชื้อชาติ"><input value={form.race} onChange={(event) => update("race", event.target.value)} /></Field>
        <SelectField label="สถานภาพสมรส" value={form.maritalStatus} placeholder="เลือกสถานภาพ" options={["โสด", "สมรส", "หย่า", "หม้าย", "ไม่ระบุ"].map((value) => ({ value, label: value }))} onChange={(value) => update("maritalStatus", value)} />
      </div>
    </div>
  );
}

function IdentityCameraCapture({ mode, onClose, onCapture }: { mode: keyof IdentityMedia; onClose: () => void; onCapture: (image: string) => void }) {
  const [facingMode, setFacingMode] = useState<"user" | "environment">(mode === "idCard" ? "environment" : "user");
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      setReady(false);
      setCameraError("");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("อุปกรณ์นี้ไม่รองรับการเปิดกล้อง กรุณาเลือกรูปจากเครื่อง");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facingMode } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError("ยังเปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องหรือเลือกรูปจากเครื่อง");
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !ready) return;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 960;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (facingMode === "user") {
      context.translate(width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, width, height);
    onCapture(canvas.toDataURL("image/jpeg", .88));
  }

  function chooseImage(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setCameraError("กรุณาใช้ไฟล์รูปภาพ JPG หรือ PNG ขนาดไม่เกิน 3 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onCapture(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  const isIdCard = mode === "idCard";
  return (
    <div className="identity-camera-backdrop">
      <section className="identity-camera-shell" role="dialog" aria-modal="true" aria-labelledby="identity-camera-title">
        <header className="identity-camera-header"><button type="button" aria-label="ปิดกล้อง" onClick={onClose}><X size={20} strokeWidth={2.5} aria-hidden="true" /></button><div><p>{isIdCard ? "ขั้นตอนที่ 1" : "ขั้นตอนที่ 2"}</p><h2 id="identity-camera-title">{isIdCard ? "สแกนบัตรประชาชน" : "ถ่ายรูปคู่บัตรประชาชน"}</h2></div><span /></header>
        <div className={`identity-camera-stage ${facingMode === "user" ? "mirrored" : ""}`}>
          <video ref={videoRef} autoPlay muted playsInline onCanPlay={() => setReady(true)} />
          {cameraError && <div className="identity-camera-error"><Camera size={30} aria-hidden="true" /><strong>ไม่สามารถเปิดกล้องได้</strong><p>{cameraError}</p></div>}
          {isIdCard ? (
            <div className="id-card-camera-guide" aria-hidden="true"><span className="corner top-left" /><span className="corner top-right" /><span className="corner bottom-left" /><span className="corner bottom-right" /><i>วางบัตรให้อยู่ภายในกรอบ</i></div>
          ) : (
            <div className="selfie-card-camera-guide" aria-hidden="true"><span className="face-guide" /><span className="held-card-guide"><i>บัตร</i></span></div>
          )}
        </div>
        <div className="identity-camera-tip"><ScanLine size={17} strokeWidth={2.3} aria-hidden="true" /><p><strong>{isIdCard ? "จัดบัตรให้ตรงและเห็นครบทั้ง 4 มุม" : "ให้เห็นใบหน้าและข้อมูลหน้าบัตรชัดเจน"}</strong><small>{isIdCard ? "หลีกเลี่ยงแสงสะท้อนและเงาบังตัวอักษร" : "ถือบัตรบริเวณกรอบด้านข้างใบหน้า"}</small></p></div>
        <div className="identity-camera-controls">
          <label><input type="file" accept="image/jpeg,image/png" onChange={(event) => chooseImage(event.target.files?.[0])} /><ScanLine size={19} aria-hidden="true" /><span>เลือกรูป</span></label>
          <button className="identity-shutter" type="button" disabled={!ready} aria-label="ถ่ายภาพ" onClick={takePhoto}><span><Camera size={24} strokeWidth={2.2} aria-hidden="true" /></span></button>
          <button type="button" aria-label="สลับกล้องหน้าและกล้องหลัง" onClick={() => setFacingMode((current) => current === "user" ? "environment" : "user")}><RefreshCw size={19} aria-hidden="true" /><span>สลับกล้อง</span></button>
        </div>
      </section>
    </div>
  );
}

type StepProps = { form: RegistrationData; errors: Errors; update: <K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) => void };

function ContactStep({ form, errors, update }: StepProps) {
  return (
    <div className="form-section">
      <SectionTitle title="ข้อมูลติดต่อ" detail="เลือกช่องทางที่สะดวกเพื่อให้คลินิกติดต่อกลับ" />
      <div className="form-grid">
        <Field label="เบอร์โทรศัพท์หลัก" required error={errors.primaryPhone}><input inputMode="tel" maxLength={10} value={form.primaryPhone} onChange={(event) => update("primaryPhone", event.target.value.replace(/\D/g, ""))} placeholder="08XXXXXXXX" /></Field>
        <Field label="เบอร์สำรอง" error={errors.alternatePhone}><input inputMode="tel" maxLength={10} value={form.alternatePhone} onChange={(event) => update("alternatePhone", event.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="อีเมล" error={errors.email}><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} /></Field>
        <Field label="LINE ID"><input value={form.lineId} onChange={(event) => update("lineId", event.target.value)} /></Field>
        <SelectField label="ภาษาที่สะดวกในการติดต่อ" value={form.preferredLanguage} options={["ไทย", "English", "中文", "อื่นๆ"].map((value) => ({ value, label: value }))} onChange={(value) => update("preferredLanguage", value)} />
        <SelectField label="ช่องทางที่สะดวกให้ติดต่อ" value={form.preferredChannel} options={["โทรศัพท์", "LINE", "อีเมล", "SMS"].map((value) => ({ value, label: value }))} onChange={(value) => update("preferredChannel", value)} />
      </div>

      <AddressFields prefix="doc" title="ที่อยู่ตามเอกสาร" form={form} errors={errors} update={update} />

      <label className="same-address-check">
        <input type="checkbox" checked={form.sameAddress} onChange={(event) => update("sameAddress", event.target.checked)} />
        <span><Check size={14} aria-hidden="true" /></span>
        <div><strong>ใช้ที่อยู่เดียวกับที่อยู่ตามเอกสาร</strong><small>ระบบจะอัปเดตที่อยู่ปัจจุบันตามจนกว่าจะยกเลิกการเลือก</small></div>
      </label>

      {!form.sameAddress && <AddressFields prefix="current" title="ที่อยู่ปัจจุบัน" form={form} errors={errors} update={update} />}
    </div>
  );
}

function AddressFields({ prefix, title, form, errors, update }: StepProps & { prefix: "doc" | "current"; title: string }) {
  const key = (name: string) => `${prefix}${name}` as keyof RegistrationData;
  const get = (name: string) => String(form[key(name)] ?? "");
  return (
    <>
      <SectionTitle title={title} detail="กรอกข้อมูลแยกช่องเพื่อความถูกต้องของประวัติ" />
      <div className="form-grid">
        <Field label="บ้านเลขที่" required error={errors[String(key("HouseNo"))]}><input value={get("HouseNo")} onChange={(event) => update(key("HouseNo"), event.target.value as never)} /></Field>
        <Field label="อาคาร/หมู่บ้าน"><input value={get("Building")} onChange={(event) => update(key("Building"), event.target.value as never)} /></Field>
        <Field label="หมู่"><input value={get("Moo")} onChange={(event) => update(key("Moo"), event.target.value as never)} /></Field>
        <Field label="ซอย"><input value={get("Soi")} onChange={(event) => update(key("Soi"), event.target.value as never)} /></Field>
        <Field label="ถนน"><input value={get("Road")} onChange={(event) => update(key("Road"), event.target.value as never)} /></Field>
        <Field label="แขวง/ตำบล" required error={errors[String(key("Subdistrict"))]}><input value={get("Subdistrict")} onChange={(event) => update(key("Subdistrict"), event.target.value as never)} /></Field>
        <Field label="เขต/อำเภอ" required error={errors[String(key("District"))]}><input value={get("District")} onChange={(event) => update(key("District"), event.target.value as never)} /></Field>
        <Field label="จังหวัด" required error={errors[String(key("Province"))]}><input value={get("Province")} onChange={(event) => update(key("Province"), event.target.value as never)} /></Field>
        <Field label="รหัสไปรษณีย์" required error={errors[String(key("PostalCode"))]}><input inputMode="numeric" maxLength={5} value={get("PostalCode")} onChange={(event) => update(key("PostalCode"), event.target.value.replace(/\D/g, "") as never)} /></Field>
        <Field label="ประเทศ" required error={errors[String(key("Country"))]}><input value={get("Country")} onChange={(event) => update(key("Country"), event.target.value as never)} /></Field>
        <Field label="ที่อยู่แบบเต็ม" full><textarea rows={3} value={get("FullAddress")} onChange={(event) => update(key("FullAddress"), event.target.value as never)} placeholder="สำหรับตรวจสอบความครบถ้วนของที่อยู่" /></Field>
      </div>
    </>
  );
}

function EmergencyStep({ form, errors, update }: StepProps) {
  const samePhone = Boolean(form.emergencyPhone && form.emergencyPhone === form.primaryPhone);
  return (
    <div className="form-section">
      <div className="privacy-callout"><ShieldCheck size={20} aria-hidden="true" /><p><strong>ใช้เฉพาะเมื่อจำเป็น</strong><br />ควรแจ้งบุคคลดังกล่าวก่อนให้ข้อมูลแก่คลินิก</p></div>
      <div className="form-grid">
        <Field label="ชื่อ–นามสกุล" required error={errors.emergencyName} full><input value={form.emergencyName} onChange={(event) => update("emergencyName", event.target.value)} /></Field>
        <SelectField label="ความสัมพันธ์" value={form.emergencyRelationship} placeholder="เลือกความสัมพันธ์" options={["คู่สมรส", "บิดา/มารดา", "พี่น้อง", "บุตร", "เพื่อน", "อื่นๆ"].map((value) => ({ value, label: value }))} onChange={(value) => update("emergencyRelationship", value)} />
        <Field label="เบอร์โทรศัพท์" required error={errors.emergencyPhone}><input inputMode="tel" maxLength={10} value={form.emergencyPhone} onChange={(event) => update("emergencyPhone", event.target.value.replace(/\D/g, ""))} /></Field>
        {samePhone && <div className="field-warning full-field">เบอร์ฉุกเฉินตรงกับเบอร์ของคุณ กรุณาตรวจสอบอีกครั้ง</div>}
        <Field label="หมายเหตุ" full><textarea rows={4} value={form.emergencyNote} onChange={(event) => update("emergencyNote", event.target.value)} placeholder="ช่วงเวลาที่สะดวกให้ติดต่อหรือข้อมูลเพิ่มเติม" /></Field>
      </div>
    </div>
  );
}

function HealthStep({ form, health, errors, updateForm, updateHealth }: {
  form: RegistrationData;
  health: HealthData;
  errors: Errors;
  updateForm: <K extends keyof RegistrationData>(key: K, value: RegistrationData[K]) => void;
  updateHealth: (key: HealthKey, field: keyof HealthEntry, value: string) => void;
}) {
  return (
    <div className="health-step">
      <SectionTitle title="ข้อมูลพื้นฐานสุขภาพ" detail="ใช้เป็นค่าเริ่มต้นสำหรับติดตามการเปลี่ยนแปลงในโปรแกรม" />
      <div className="form-grid health-baseline">
        <Field label="ส่วนสูง (ซม.)" required error={errors.height}><input type="number" min="100" max="250" value={form.height} onChange={(event) => updateForm("height", event.target.value)} /></Field>
        <Field label="น้ำหนักตั้งต้น (กก.)" required error={errors.startWeight}><input type="number" min="30" max="350" step="0.1" value={form.startWeight} onChange={(event) => updateForm("startWeight", event.target.value)} /></Field>
      </div>
      <SectionTitle title="ประวัติสุขภาพ" detail="เลือกสถานะและระบุรายละเอียดที่จำเป็นให้ครบถ้วน" />
      <div className="health-list">
        {healthTopics.map(({ key, label, hint }) => {
          const entry = health[key];
          return (
            <article className={`health-card ${entry.status ? "answered" : ""}`} key={key}>
              <div className="health-heading"><div><strong>{label}<em>*</em></strong><small>{hint}</small></div>{entry.status && <span><Check size={13} aria-hidden="true" /></span>}</div>
              <div className="health-options" role="radiogroup" aria-label={label}>
                {[["none", "ไม่มี"], ["yes", "มี"], ["unknown", "ไม่ทราบ"]].map(([value, text]) => <button key={value} type="button" className={entry.status === value ? "selected" : ""} onClick={() => updateHealth(key, "status", value)}>{text}</button>)}
              </div>
              {errors[`health.${key}.status`] && <p className="field-error">{errors[`health.${key}.status`]}</p>}
              {entry.status === "yes" && key === "drugAllergy" && (
                <div className="health-details form-grid">
                  <Field label="ชื่อยาที่แพ้" required error={errors[`health.${key}.drugName`]}><input value={entry.drugName} onChange={(event) => updateHealth(key, "drugName", event.target.value)} /></Field>
                  <Field label="อาการแพ้" required error={errors[`health.${key}.reaction`]}><input value={entry.reaction} onChange={(event) => updateHealth(key, "reaction", event.target.value)} /></Field>
                  <SelectField label="ระดับความรุนแรง" required error={errors[`health.${key}.severity`]} value={entry.severity} placeholder="เลือกระดับ" options={["เล็กน้อย", "ปานกลาง", "รุนแรง", "ไม่ทราบ"].map((value) => ({ value, label: value }))} onChange={(value) => updateHealth(key, "severity", value)} />
                  <Field label="วันที่เกิดอาการโดยประมาณ"><input type="date" value={entry.approximateDate} onChange={(event) => updateHealth(key, "approximateDate", event.target.value)} /></Field>
                  <Field label="หมายเหตุ" full><textarea rows={3} value={entry.note} onChange={(event) => updateHealth(key, "note", event.target.value)} /></Field>
                </div>
              )}
              {entry.status === "yes" && key !== "drugAllergy" && (
                <div className="health-details"><Field label="รายละเอียด" required error={errors[`health.${key}.details`]} full><textarea rows={3} value={entry.details} onChange={(event) => updateHealth(key, "details", event.target.value)} placeholder="ระบุรายละเอียดและช่วงเวลาโดยประมาณ" /></Field></div>
              )}
              {entry.status === "unknown" && <p className="unknown-note">พนักงานอาจสอบถามข้อมูลเพิ่มเติมก่อนรับบริการ</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ReviewStep({ form, health, identityMedia, consents, requiredConsents, otpVerified, onOtpVerified, onSignupProof, signerIntent, onSignerIntent, signaturePadVersion, onConsent, onEdit, onSignatureChange }: {
  form: RegistrationData;
  health: HealthData;
  identityMedia: IdentityMedia;
  consents: ConsentData;
  requiredConsents: boolean;
  otpVerified: boolean;
  onOtpVerified: (value: boolean) => void;
  onSignupProof: (value: string) => void;
  signerIntent: boolean;
  onSignerIntent: (value: boolean) => void;
  signaturePadVersion: number;
  onConsent: (key: keyof ConsentData, value: boolean) => void;
  onEdit: (step: number) => void;
  onSignatureChange: (value: string) => void;
}) {
  const [documentTitle, setDocumentTitle] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const healthYes = healthTopics.filter(({ key }) => health[key].status === "yes").map(({ label }) => label);
  const maskedDocument = form.documentNumber.length > 4 ? `${"•".repeat(Math.max(0, form.documentNumber.length - 4))}${form.documentNumber.slice(-4)}` : form.documentNumber;

  function sendOtp() {
    setOtpCode("");
    setOtpError("");
    onOtpVerified(false);
    onSignupProof('');
    setOtpSent(true);
  }

  function verifyOtp() {
    const valid = otpSent && otpCode === MOCK_OTP;
    onOtpVerified(valid);
    setOtpError(valid ? '' : 'รหัส OTP ไม่ถูกต้อง');
  }

  return (
    <div className="review-stack">
      <SectionTitle title="สรุปข้อมูล" detail="แตะเพื่อเปิดดูรายละเอียด หรือย้อนกลับไปแก้ไขแต่ละส่วน" />
      <SummarySection title="การยืนยันตัวตน" onEdit={() => onEdit(1)}><SummaryLine label="สแกนบัตรประชาชน" value={identityMedia.idCard ? "เรียบร้อย" : "ยังไม่ได้สแกน"} /><SummaryLine label="รูปถ่ายคู่บัตร" value={identityMedia.selfieWithCard ? "เรียบร้อย" : "ยังไม่ได้ถ่าย"} /></SummarySection>
      <SummarySection title="ข้อมูลส่วนตัว" onEdit={() => onEdit(1)}><SummaryLine label="ชื่อ–นามสกุล" value={`${form.title} ${form.firstName} ${form.lastName}`} /><SummaryLine label="เอกสาร" value={form.documentType === "thai_id" ? "บัตรประชาชน" : "Passport"} /><SummaryLine label="วันเกิด" value={form.birthDate || "–"} /></SummarySection>
      <SummarySection title="ข้อมูลติดต่อ" onEdit={() => onEdit(2)}><SummaryLine label="โทรศัพท์" value={form.primaryPhone} /><SummaryLine label="อีเมล" value={form.email || "ไม่ได้ระบุ"} /><SummaryLine label="ช่องทางที่สะดวก" value={form.preferredChannel} /></SummarySection>
      <SummarySection title="ที่อยู่" onEdit={() => onEdit(2)}><SummaryLine label="ตามเอกสาร" value={`${form.docHouseNo} ${form.docSubdistrict} ${form.docDistrict} ${form.docProvince} ${form.docPostalCode}`} /><SummaryLine label="ปัจจุบัน" value={form.sameAddress ? "เหมือนที่อยู่ตามเอกสาร" : `${form.currentHouseNo} ${form.currentDistrict} ${form.currentProvince}`} /></SummarySection>
      <SummarySection title="ผู้ติดต่อฉุกเฉิน" onEdit={() => onEdit(3)}><SummaryLine label="ชื่อ" value={form.emergencyName} /><SummaryLine label="ความสัมพันธ์" value={form.emergencyRelationship || "ไม่ได้ระบุ"} /><SummaryLine label="โทรศัพท์" value={form.emergencyPhone} /></SummarySection>
      <SummarySection title="ข้อมูลสุขภาพ" onEdit={() => onEdit(4)}><SummaryLine label="ส่วนสูง / น้ำหนักตั้งต้น" value={`${form.height} ซม. / ${form.startWeight} กก.`} /><SummaryLine label="หัวข้อที่ตอบว่ามี" value={healthYes.length ? healthYes.join(", ") : "ไม่มี"} /><SummaryLine label="ตอบครบ" value={`${healthTopics.filter(({ key }) => health[key].status).length}/${healthTopics.length} หัวข้อ`} /></SummarySection>
      <SummarySection title="ข้อมูลนัดหมาย"><SummaryLine label="นัดติดตามผล" value="29 สิงหาคม 2569 เวลา 14:30 น." /><SummaryLine label="สาขา" value="The Ritz Clinic" /></SummarySection>

      <SectionTitle title="การยินยอม" detail="รายการโปรโมชั่นเป็นทางเลือกและไม่ได้เลือกไว้ล่วงหน้า" />
      <div className="consent-list">
        <ConsentRow checked={consents.accurate} required label="ยืนยันว่าข้อมูลถูกต้อง" onChange={(value) => onConsent("accurate", value)} />
        <ConsentRow checked={consents.personalData} required label="ยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคล" link="ดูฉบับเต็ม" onLink={() => setDocumentTitle("หนังสือยินยอมให้เก็บและใช้ข้อมูลส่วนบุคคล")} onChange={(value) => onConsent("personalData", value)} />
        <ConsentRow checked={consents.privacy} required label="รับทราบ Privacy Policy" link="ดูฉบับเต็ม" onLink={() => setDocumentTitle("นโยบายความเป็นส่วนตัว")} onChange={(value) => onConsent("privacy", value)} />
        <ConsentRow checked={consents.treatmentContact} required label="ยินยอมให้ติดต่อเรื่องนัดหมายและการรักษา" link="ดูฉบับเต็ม" onLink={() => setDocumentTitle("ความยินยอมด้านการติดต่อและการรักษา")} onChange={(value) => onConsent("treatmentContact", value)} />
        <ConsentRow checked={consents.marketing} label="ยินยอมรับข่าวสารและโปรโมชั่น" onChange={(value) => onConsent("marketing", value)} />
      </div>

      <section className="esign-panel" aria-labelledby="esign-title">
        <div className="esign-heading">
          <span><ShieldCheck size={20} strokeWidth={2.3} aria-hidden="true" /></span>
          <div><p className="eyebrow">ยืนยันและลงนาม</p><h2 id="esign-title">ลายเซ็นอิเล็กทรอนิกส์</h2><small>ทำตาม 3 ขั้นตอนด้านล่าง</small></div>
        </div>

        <div className="esign-flow">
          <section className="esign-step complete">
            <span className="esign-step-number"><Check size={15} strokeWidth={3} aria-hidden="true" /></span>
            <div className="esign-step-content">
              <div className="esign-step-title"><div><small>ขั้นตอนที่ 1</small><h3>ตรวจสอบเอกสาร</h3></div><span>พร้อมลงนาม</span></div>
              <div className="esign-document-meta"><div><small>ชุดเอกสาร</small><strong>{CONSENT_DOCUMENT_VERSION}</strong></div><p>ข้อมูลลงทะเบียนและหนังสือยินยอม</p></div>
              <div className="signer-identity">
                <div><small>ผู้ลงนาม</small><strong>{form.title} {form.firstName} {form.lastName}</strong></div>
                <div><small>{form.documentType === "thai_id" ? "เลขบัตรประชาชน" : "Passport"}</small><strong>{maskedDocument}</strong></div>
              </div>
            </div>
          </section>

          <section className={`esign-step ${otpVerified ? "complete" : "active"}`}>
            <span className="esign-step-number">{otpVerified ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : "2"}</span>
            <div className="esign-step-content">
              <div className="esign-step-title"><div><small>ขั้นตอนที่ 2</small><h3>ยืนยันเบอร์โทรศัพท์</h3></div>{otpVerified && <span>เรียบร้อย</span>}</div>
              <div className={`otp-verification ${otpVerified ? "verified" : ""}`}>
                <div className="otp-heading"><div><small>ส่งรหัส OTP ไปที่</small><strong>{form.primaryPhone.replace(/(\d{3})\d{4}(\d{3})/, "$1••••$2")}</strong></div>{otpVerified && <span><Check size={14} strokeWidth={3} aria-hidden="true" />ยืนยันแล้ว</span>}</div>
                {!otpVerified && <button className="otp-send" type="button" onClick={sendOtp}>{otpSent ? "ส่งรหัสอีกครั้ง" : "ส่งรหัส OTP"}</button>}
                {otpSent && !otpVerified && (
                  <div className="otp-entry"><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otpCode} onChange={(event) => { setOtpCode(event.target.value.replace(/\D/g, "")); setOtpError(""); }} placeholder="รหัส 6 หลัก" aria-label="รหัส OTP 6 หลัก" /><button type="button" onClick={verifyOtp} disabled={otpCode.length !== 6}>ยืนยัน</button></div>
                )}
                {otpSent && !otpVerified && <p className="otp-demo">รหัสสำหรับทดสอบ: 123456</p>}
                {otpError && <p className="field-error">{otpError}</p>}
              </div>
            </div>
          </section>

          <section className={`esign-step ${otpVerified && signerIntent ? "active" : ""}`}>
            <span className="esign-step-number">3</span>
            <div className="esign-step-content">
              <div className="esign-step-title"><div><small>ขั้นตอนที่ 3</small><h3>เซ็นชื่อ</h3></div></div>
              <label className={`signer-intent ${signerIntent ? "checked" : ""}`}>
                <input type="checkbox" checked={signerIntent} onChange={(event) => onSignerIntent(event.target.checked)} />
                <span>{signerIntent && <Check size={14} strokeWidth={3} aria-hidden="true" />}</span>
                <div><strong>ฉันอ่านและยอมรับเอกสารแล้ว <em>*</em></strong><small>ยืนยันว่าลงลายมือชื่อด้วยตนเอง • {CONSENT_DOCUMENT_VERSION}</small></div>
              </label>
              <SignaturePad key={signaturePadVersion} disabled={!requiredConsents || !otpVerified || !signerIntent} onSignatureChange={onSignatureChange} />
            </div>
          </section>
        </div>

        <details className="esign-evidence">
          <summary>ดูรายละเอียดหลักฐานอิเล็กทรอนิกส์ <ChevronDown size={15} aria-hidden="true" /></summary>
          <div><ul><li>ตัวตนผู้ลงนามและผลยืนยัน OTP</li><li>ภาพลายเซ็น วันเวลา และเวอร์ชันเอกสาร</li><li>ค่า SHA-256 เพื่อตรวจพบการแก้ไขข้อมูลภายหลัง</li></ul></div>
        </details>
        <p className="esign-prototype-note">ต้นแบบนี้จำลองขั้นตอนเท่านั้น ก่อนใช้งานจริงต้องบันทึกชุดหลักฐานบนระบบหลังบ้านที่ป้องกันการแก้ไขย้อนหลัง และให้ฝ่ายกฎหมายของคลินิกตรวจเอกสาร</p>
      </section>
      {documentTitle && <ConsentDocument title={documentTitle} onClose={() => setDocumentTitle("")} />}
    </div>
  );
}

function ConsentDocument({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="legal-document-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <article className="legal-document" role="dialog" aria-modal="true" aria-labelledby="legal-title">
        <div><h2 id="legal-title">{title}</h2><button type="button" aria-label="ปิดเอกสาร" onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
        <p>Program Resize และ The Ritz Clinic จะใช้ข้อมูลตามวัตถุประสงค์ที่จำเป็นต่อการลงทะเบียน การจัดทำประวัติ การประเมินความปลอดภัย การนัดหมาย และการให้บริการทางการแพทย์เท่านั้น</p>
        <h3>ข้อมูลที่อาจมีการเก็บและใช้</h3>
        <ul><li>ข้อมูลระบุตัวตนและข้อมูลติดต่อ</li><li>ข้อมูลสุขภาพ ประวัติการรักษา และข้อมูลการแพ้ยา</li><li>ข้อมูลนัดหมาย เอกสารยินยอม และลายเซ็น</li></ul>
        <h3>สิทธิของเจ้าของข้อมูล</h3>
        <p>คุณสามารถขอเข้าถึง แก้ไข คัดค้าน หรือถอนความยินยอมตามขอบเขตที่กฎหมายกำหนด โดยติดต่อคลินิกผ่านช่องทางที่แจ้งไว้</p>
        <p className="legal-note">เอกสารนี้เป็นข้อความสำหรับหน้าต้นแบบ ควรให้ฝ่ายกฎหมายตรวจสอบและแทนที่ด้วยเอกสารฉบับอนุมัติก่อนใช้งานจริง</p>
        <button className="legal-close" type="button" onClick={onClose}>รับทราบและปิด</button>
      </article>
    </div>
  );
}

function SignaturePad({ disabled, onSignatureChange }: { disabled: boolean; onSignatureChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d")!;
    const position = point(event);
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath();
    context.moveTo(position.x, position.y);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled || !drawing.current) return;
    const context = canvasRef.current!.getContext("2d")!;
    const position = point(event);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#56377b";
    context.lineTo(position.x, position.y);
    context.stroke();
    hasInk.current = true;
  }

  function finish() {
    drawing.current = false;
    if (hasInk.current && canvasRef.current) onSignatureChange(canvasRef.current.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    onSignatureChange("");
  }

  return (
    <div className={`signature-pad ${disabled ? "disabled" : ""}`}>
      <canvas ref={canvasRef} width={760} height={220} onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish} aria-label="พื้นที่สำหรับเซ็นลายเซ็น" aria-disabled={disabled} />
      {disabled && <span className="signature-lock"><LockKeyhole size={16} aria-hidden="true" />กรุณายืนยันข้อมูลและ OTP ก่อนเซ็น</span>}
      <div><small>เซ็นภายในกรอบด้านบน</small><button type="button" onClick={clear}>ล้างลายเซ็น</button></div>
    </div>
  );
}

function SuccessScreen({ submittedAt, evidenceId, evidenceHash, onComplete }: { submittedAt: string; evidenceId: string; evidenceHash: string; onComplete: () => void }) {
  const [saved, setSaved] = useState(false);
  async function saveRequestNumber() {
    try { await navigator.clipboard.writeText("HN-260811-041"); } catch { /* Clipboard may be unavailable in preview. */ }
    setSaved(true);
  }
  return (
    <main className="app-shell registration-shell success-shell">
      <div className="success-mark"><Check size={35} strokeWidth={2.8} aria-hidden="true" /></div>
      <p className="eyebrow">REGISTRATION COMPLETE</p>
      <h1>ส่งข้อมูลสำเร็จ</h1>
      <p className="success-lead">สร้างประวัติผู้รับบริการและหมายเลข HN เรียบร้อยแล้ว</p>
      <article className="request-card">
        <span>หมายเลข HN</span><strong>HN-260811-041</strong>
        <div><small>สถานะ</small><b>ลงทะเบียนสำเร็จ</b></div>
      </article>
      <div className="success-details">
        <SummaryLine label="หลักฐาน e-Signature" value={evidenceId} />
        <SummaryLine label="เวอร์ชันเอกสาร" value={CONSENT_DOCUMENT_VERSION} />
        <SummaryLine label="SHA-256" value={evidenceHash} />
        <SummaryLine label="นัดหมาย" value="29 สิงหาคม 2569 เวลา 14:30 น." />
        <SummaryLine label="สาขา" value="The Ritz Clinic" />
        <SummaryLine label="วันที่และเวลาที่ส่ง" value={submittedAt} />
      </div>
      {saved && <p className="success-saved"><Check size={14} aria-hidden="true" />คัดลอกหมายเลข HN แล้ว</p>}
      <div className="success-actions"><button type="button" onClick={saveRequestNumber}>คัดลอก HN</button><button type="button" onClick={() => window.location.href = "tel:020000000"}>ติดต่อคลินิก</button><button className="primary" type="button" onClick={onComplete}>เข้าสู่หน้าหลัก</button></div>
    </main>
  );
}

type SelectOption = { value: string; label: string };

function SelectField({ label, required = false, error, value, placeholder = "เลือกข้อมูล", options, onChange }: {
  label: string;
  required?: boolean;
  error?: string;
  value: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  return (
    <div className={`form-field select-field ${error ? "invalid" : ""}`}>
      <span id={labelId}>{label}{required && <em>*</em>}</span>
      <ModernSelect ariaLabelledby={labelId} invalid={Boolean(error)} value={value} placeholder={placeholder} options={options} onChange={onChange} />
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

function ModernSelect({ ariaLabelledby, invalid, value, placeholder, options, onChange }: {
  ariaLabelledby: string;
  invalid: boolean;
  value: string;
  placeholder: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const triggerId = useId();
  const listboxId = useId();
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  useEffect(() => {
    function closeFromOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeFromOutside);
    return () => document.removeEventListener("pointerdown", closeFromOutside);
  }, []);

  function openMenu(index = selectedIndex >= 0 ? selectedIndex : 0) {
    setOpen(true);
    window.requestAnimationFrame(() => optionRefs.current[index]?.focus());
  }

  function choose(option: SelectOption) {
    onChange(option.value);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function moveFocus(index: number) {
    const nextIndex = (index + options.length) % options.length;
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div className={`modern-select ${open ? "open" : ""}`} ref={rootRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }}>
      <button
        id={triggerId}
        ref={triggerRef}
        className={`modern-select-trigger ${selected ? "" : "placeholder"}`}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-labelledby={`${ariaLabelledby} ${triggerId}`}
        aria-invalid={invalid || undefined}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            openMenu(event.key === "ArrowUp" ? Math.max(options.length - 1, 0) : selectedIndex >= 0 ? selectedIndex : 0);
          }
        }}
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={17} strokeWidth={2.2} aria-hidden="true" />
      </button>
      {open && (
        <div id={listboxId} className="modern-select-menu" role="listbox" aria-labelledby={ariaLabelledby}>
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(node) => { optionRefs.current[index] = node; }}
              className={`modern-select-option ${option.value === value ? "selected" : ""}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => choose(option)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") { event.preventDefault(); moveFocus(index + 1); }
                if (event.key === "ArrowUp") { event.preventDefault(); moveFocus(index - 1); }
                if (event.key === "Home") { event.preventDefault(); moveFocus(0); }
                if (event.key === "End") { event.preventDefault(); moveFocus(options.length - 1); }
                if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
              }}
            >
              <span>{option.label}</span>
              <i><Check size={13} strokeWidth={3} aria-hidden="true" /></i>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, required = false, error, full = false, children }: { label: string; required?: boolean; error?: string; full?: boolean; children: React.ReactNode }) {
  return <label className={`form-field ${full ? "full-field" : ""} ${error ? "invalid" : ""}`}><span>{label}{required && <em>*</em>}</span>{children}{error && <small className="field-error">{error}</small>}</label>;
}

function SectionTitle({ title, detail }: { title: string; detail: string }) {
  return <div className="form-section-title"><h2>{title}</h2><p>{detail}</p></div>;
}

function SummarySection({ title, onEdit, children }: { title: string; onEdit?: () => void; children: React.ReactNode }) {
  return <details className="summary-section"><summary><span>{title}</span><div>{onEdit && <button type="button" onClick={(event) => { event.preventDefault(); onEdit(); }}>แก้ไข</button>}<ChevronDown size={17} aria-hidden="true" /></div></summary><div className="summary-content">{children}</div></details>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="summary-line"><span>{label}</span><strong>{value || "–"}</strong></div>;
}

function ConsentRow({ checked, label, required = false, link, onLink, onChange }: { checked: boolean; label: string; required?: boolean; link?: string; onLink?: () => void; onChange: (value: boolean) => void }) {
  return <div className="consent-row"><label><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><Check size={13} aria-hidden="true" /></span><strong>{label}{required && <em>*</em>}</strong></label>{link && <button type="button" onClick={onLink}>{link}</button>}</div>;
}
