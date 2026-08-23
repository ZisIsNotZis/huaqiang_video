import React from 'react';
import {Composition} from 'remotion';
import {HuaqiangMelon} from './HuaqiangMelon';

export const Root: React.FC = () => {
  return (
    <Composition
      id="HuaqiangMelon"
      component={HuaqiangMelon}
      durationInFrames={2100}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
