import { staticFile } from "remotion";
import { getVideoMetadata, VideoMetadata } from "@remotion/media-utils";
import { llm } from "cosine-api";
import { ThreeCanvas, useVideoTexture } from "@remotion/three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, useVideoConfig, Video } from "remotion";
import { z } from "zod";
import { zColor } from "@remotion/zod-types";
import { Phone } from "./Phone";

const container: React.CSSProperties = {
  backgroundColor: "white",
};

const videoStyle: React.CSSProperties = {
  position: "absolute",
  opacity: 0,
};

export const myCompSchema = z.object({
  phoneColor: zColor(),
  deviceType: z.enum(["phone", "tablet"]),
});

type MyCompSchemaType = z.infer<typeof myCompSchema>;

export const Scene: React.FC<
  {
    readonly baseScale: number;
  } & MyCompSchemaType
> = ({ baseScale, phoneColor, deviceType }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { width, height } = useVideoConfig();
  const [videoData, setVideoData] = useState<VideoMetadata | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string>("");

  const refinedPrompt = useMemo(() => {
    return `Give a brief description of what the phoneColor is ${phoneColor} and the type of device is ${deviceType} and the total amount of frames is ${width * height} and the aspect ratio of the video is: ${
      (width * height) / width
    } and the video is about the creation of a phone.`;
  }, [initialPrompt, deviceType, phoneColor, width, height]);

  const videoSrc =
    refinedPrompt === "phone"
      ? staticFile("phone.mp4")
      : staticFile("tablet.mp4");

  const baseUrl = "http://localhost:3000";
  const API_KEY = "abc";

  useEffect(() => {
    const helper = async () => {
      const find_refined_prompt = await llm(
        baseUrl,
        API_KEY,
        initialPrompt,
        "gpt-3.5-turbo",
      );
      console.log({ initialPrompt });
      console.log({ find_refined_prompt });
    };

    helper();
  }, [initialPrompt]);

  useEffect(() => {
    getVideoMetadata(videoSrc)
      .then((data) => setVideoData(data))
      .catch((err) => console.log(err));
  }, [videoSrc]);

  const texture = useVideoTexture(videoRef);
  return (
    <AbsoluteFill style={container}>
      <input
        value={initialPrompt}
        onChange={(e) => setInitialPrompt(e.target.value)}
        placeholder="Enter your user prompt"
      />
      <div>{initialPrompt}</div>
      <div>{refinedPrompt}</div>

      <Video ref={videoRef} src={videoSrc} style={videoStyle} />
      {videoData ? (
        <ThreeCanvas linear width={width} height={height}>
          <ambientLight intensity={1.5} color={0xffffff} />
          <pointLight position={[10, 10, 0]} />
          <Phone
            phoneColor={phoneColor}
            baseScale={baseScale}
            videoTexture={texture}
            aspectRatio={videoData.aspectRatio}
          />
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};