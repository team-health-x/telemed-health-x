import Image from "next/image";

export default function TelehealthLogo({ className = "", priority = false }: { className?: string; priority?: boolean }) {
  return <Image className={`telehealth-logo ${className}`} src="/the-ritz-telehealth-logo.png" alt="THE RITZ telehealth" width={1518} height={488} priority={priority} />;
}
