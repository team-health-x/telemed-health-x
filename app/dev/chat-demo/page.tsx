import { notFound } from 'next/navigation';
import ChatDemo from './chat-demo';

export const dynamic = 'force-dynamic';

export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <ChatDemo />;
}
