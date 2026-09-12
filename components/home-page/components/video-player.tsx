'use client';

import {
  MediaControlBar,
  MediaController,
  MediaMuteButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
  MediaFullscreenButton,
} from 'media-chrome/react';
import type { ComponentProps, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export type VideoPlayerProps = ComponentProps<typeof MediaController>;

const variables = {
  '--media-primary-color': '#ffffff',
  '--media-secondary-color': '#000000',
  '--media-text-color': '#ffffff',
  '--media-background-color': 'rgba(0, 0, 0, 0.5)',
  '--media-control-background': 'rgba(20, 20, 30, 0.7)',
  '--media-control-hover-background': 'rgba(50, 50, 60, 0.9)',
  '--media-time-range-rail-color': 'rgba(255, 255, 255, 0.2)',
  '--media-range-track-color': 'rgba(255, 255, 255, 0.4)',
  '--media-range-bar-color': '#ffffff',
  '--media-range-thumb-color': '#ffffff',
  '--media-control-border-radius': '4px',
  '--media-control-padding': '8px',
  '--media-control-margin': '4px',
  '--media-button-icon-width': '24px',
  '--media-button-icon-height': '24px',
  '--media-button-padding': '8px',
} as CSSProperties;

export const VideoPlayer = ({ style, className, ...props }: VideoPlayerProps) => (
  <MediaController
    className={cn("overflow-hidden rounded-xl border border-white/20 bg-black/5 backdrop-blur-sm", className)}
    style={{
      ...variables,
      ...style,
    }}
    {...props}
  />
);

export type VideoPlayerContentProps = ComponentProps<'video'> & {
  slot?: string;
};

export const VideoPlayerContent = ({ slot, className, ...props }: VideoPlayerContentProps) => (
  <video 
    slot={slot} 
    className={cn("w-full h-full object-cover", className)}
    tabIndex={-1}
    suppressHydrationWarning={true}
    {...props} 
  />
);

export type VideoPlayerControlBarProps = ComponentProps<typeof MediaControlBar>;
export const VideoPlayerControlBar = ({ className, ...props }: VideoPlayerControlBarProps) => (
  <MediaControlBar 
    className={cn("bg-gradient-to-t from-black/50 to-transparent backdrop-blur-[2px]", className)}
    {...props} 
  />
);

export type VideoPlayerPlayButtonProps = ComponentProps<typeof MediaPlayButton>;
export const VideoPlayerPlayButton = (props: VideoPlayerPlayButtonProps) => (
  <MediaPlayButton {...props} />
);

export type VideoPlayerSeekBackwardButtonProps = ComponentProps<typeof MediaSeekBackwardButton>;
export const VideoPlayerSeekBackwardButton = (props: VideoPlayerSeekBackwardButtonProps) => (
  <MediaSeekBackwardButton {...props} />
);

export type VideoPlayerSeekForwardButtonProps = ComponentProps<typeof MediaSeekForwardButton>;
export const VideoPlayerSeekForwardButton = (props: VideoPlayerSeekForwardButtonProps) => (
  <MediaSeekForwardButton {...props} />
);

export type VideoPlayerTimeRangeProps = ComponentProps<typeof MediaTimeRange>;
export const VideoPlayerTimeRange = ({
  className,
  ...props
}: VideoPlayerTimeRangeProps) => (
  <MediaTimeRange className={cn('p-2.5', className)} {...props} />
);

export type VideoPlayerTimeDisplayProps = ComponentProps<typeof MediaTimeDisplay>;
export const VideoPlayerTimeDisplay = (props: VideoPlayerTimeDisplayProps) => (
  <MediaTimeDisplay {...props} />
);

export type VideoPlayerMuteButtonProps = ComponentProps<typeof MediaMuteButton>;
export const VideoPlayerMuteButton = (props: VideoPlayerMuteButtonProps) => (
  <MediaMuteButton {...props} />
);

export type VideoPlayerVolumeRangeProps = ComponentProps<typeof MediaVolumeRange>;
export const VideoPlayerVolumeRange = (props: VideoPlayerVolumeRangeProps) => (
  <MediaVolumeRange {...props} />
);

export type VideoPlayerFullscreenButtonProps = ComponentProps<typeof MediaFullscreenButton>;
export const VideoPlayerFullscreenButton = (props: VideoPlayerFullscreenButtonProps) => (
  <MediaFullscreenButton {...props} />
); 