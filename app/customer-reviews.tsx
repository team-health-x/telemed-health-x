"use client";

import Image from "next/image";
import { useRef } from "react";

const results = [
  { id: 2, alt: "รีวิวผู้รับบริการ Resize ภาพก่อนและหลัง พร้อมข้อความผลลัพธ์ 20 กิโลกรัม" },
  { id: 3, alt: "รีวิวผู้รับบริการ Resize ภาพก่อนและหลัง พร้อมข้อความผลลัพธ์ 7 กิโลกรัม" },
  { id: 1, alt: "รีวิวผู้รับบริการ Resize November Mission" },
];

export default function CustomerReviews() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section ref={sectionRef} className="reviews-section section-pad" id="reviews" aria-labelledby="reviews-title">
      <div className="section-heading">
        <p className="eyebrow">RESIZE STORIES</p>
        <h2 id="reviews-title">ประสบการณ์จากผู้รับบริการ</h2>
        <p>ผลลัพธ์ขึ้นอยู่กับแต่ละบุคคล</p>
      </div>
      <div className="review-images">
        {results.map(({ id, alt }) => (
          <a key={id} className="review-image" href={`/review-result-${id}.webp`} target="_blank" rel="noopener noreferrer" aria-label={`ดูภาพขนาดเต็ม: ${alt}`}>
            <Image src={`/review-result-${id}.webp`} alt={alt} fill sizes="(max-width: 600px) 100vw, 33vw" />
          </a>
        ))}
      </div>
      <div className="review-videos">
        {[1, 2, 3, 4].map(id => (
          <div className="review-video" key={id}>
            {/* Source clips have embedded text; separate caption files were not supplied. */}
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video controls playsInline preload="none" width={576} height={1024}
              poster={`/review-video-${id}.jpg`} aria-label={`วิดีโอประสบการณ์ผู้รับบริการ ${id}`}
              onPlay={event => {
                sectionRef.current?.querySelectorAll('video').forEach(video => {
                  if (video !== event.currentTarget) video.pause();
                });
              }}>
              <source src={`/review-video-${id}.mp4`} type="video/mp4" />
              <a href={`/review-video-${id}.mp4`}>เปิดวิดีโอรีวิว {id}</a>
            </video>
          </div>
        ))}
      </div>
    </section>
  );
}
