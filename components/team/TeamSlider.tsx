"use client";
import React, { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
// @ts-ignore
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";

interface SliderItem {
  image: string;
  name: string;
  index: number;
}

interface TeamSliderProps {
  items: SliderItem[];
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

const TeamSlider: React.FC<TeamSliderProps> = ({
  items,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const swiperRef = useRef<SwiperType | null>(null);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold mb-4">Team Slider</h2>
        <button
          type="button"
          onClick={onAdd}
          className="px-4 py-1.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          + Add New
        </button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          {/* Swiper Component */}
          <Swiper
            modules={[Navigation]}
            spaceBetween={16}
            slidesPerView="auto"
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
          >
            {items.map((item, index) => (
              <SwiperSlide key={index} className="w-48!">
                <div className="relative group border h-[220px] flex justify-center items-center flex-col border-gray-300 rounded-md p-3">
                  <div className="relative w-[150px] h-[150px] flex-shrink-0 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
                    <Image
                      width={100}
                      height={100}
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(index)}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="Edit"
                        >
                          <svg
                            className="w-4 h-4 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(index)}
                          className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-center text-gray-700 line-clamp-2">
                    {item.name}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Navigation Buttons - Right Aligned */}
          <div className="flex justify-end gap-2 mb-2">
            <button
              type="button"
              onClick={() => swiperRef.current?.slidePrev()}
              className="cursor-pointer bg-primary text-white rounded-full p-2"
              title="Previous"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => swiperRef.current?.slideNext()}
              className="cursor-pointer bg-primary text-white rounded-full p-2"
              title="Next"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No slider items added yet</p>
      )}
    </div>
  );
};

export default TeamSlider;
