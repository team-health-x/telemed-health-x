"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

export default function DoctorVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  async function play() {
    const video = videoRef.current;
    if (!video) return;
    setFailed(false);
    try {
      await video.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className="doctor-video-section" aria-label="วิดีโอแนะนำโปรแกรมโดยแพทย์">
      <div className="doctor-video-player">
        {/* DR2 includes burned-in Thai captions in the source video. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          width={1280}
          height={720}
          controls={started}
          preload="none"
          playsInline
          poster="/program-resize-logo.png"
          aria-label="แพทย์แนะนำโปรแกรม Resize by THE RITZ"
          onPlay={() => { setStarted(true); setFailed(false); }}
          onError={() => setFailed(true)}
        >
          <source src="/doctor-introduction.mp4" type="video/mp4" />
          <a href="/doctor-introduction.mp4">เปิดวิดีโอ</a>
        </video>
        {!started && (
          <button className="doctor-video-play" type="button" onClick={play}
            aria-label="เล่นวิดีโอแนะนำโปรแกรมโดยแพทย์" title="เล่นวิดีโอ">
            <Play aria-hidden="true" />
          </button>
        )}
      </div>
      {failed && <p role="alert">ไม่สามารถเล่นวิดีโอได้ <a href="/doctor-introduction.mp4">เปิดวิดีโอโดยตรง</a></p>}
    </section>
  );
}
