import React from 'react';
import {usePanel} from '../state';
const assetPathPrefix = "/assets/workers-banner";
const imgContainer = `${assetPathPrefix}/f8033.svg`;

export default function Background() {
  const {records}=usePanel();
  return (
    <div className="design-workers-banner-1" data-node-id="8:3324" data-name="Background">
      <div className="design-workers-banner-2" data-node-id="8:3325" data-name="Container">
        <div className="design-workers-banner-3" data-node-id="8:3326" data-name="Background">
          <div className="design-workers-banner-4" data-node-id="8:3327" data-name="Container">
            <img alt="" className="design-workers-banner-5" src={imgContainer} />
          </div>
        </div>
        <div className="design-workers-banner-6" data-node-id="8:3329" data-name="Container">
          <div className="design-workers-banner-7" data-node-id="8:3330" data-name="Container">
            <div className="design-workers-banner-8" data-node-id="8:3331">
              <p className="design-workers-banner-9">Authorised Internal Staff View Only</p>
            </div>
          </div>
          <div className="design-workers-banner-10" data-node-id="8:3332" data-name="Container">
            <div className="design-workers-banner-11" data-node-id="8:3333">
              <p className="design-workers-banner-12">•</p>
            </div>
          </div>
          <div className="design-workers-banner-13" data-node-id="8:3334" data-name="Container">
            <div className="design-workers-banner-14" data-node-id="8:3335">
              <p className="design-workers-banner-15">{`Strict Privacy & Victorian Labour Hire Licensing Act (Vic) 2018 Protected`}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="design-workers-banner-16" data-node-id="8:3336" data-name="Container">
        <div className="design-workers-banner-17" data-node-id="8:3337" data-name="Background" />
        <div className="design-workers-banner-18" data-node-id="8:3338" data-name="Container">
          <div className="design-workers-banner-19" data-node-id="8:3339">
            <p className="design-workers-banner-20">SYNC: LIVE VIC REGISTRY</p>
          </div>
        </div>
      </div>
    </div>
  );
}

