import React from 'react';
import { ProgressionMap } from '../components/ProgressionMap';

const ProgressionMapPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-130px)] flex flex-col pb-2">
      <ProgressionMap className="flex-1 min-h-0 flex flex-col" />
    </div>
  );
};

export default ProgressionMapPage;
