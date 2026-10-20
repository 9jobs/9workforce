import React from 'react';
import {usePanel} from '../state';
const assetPathPrefix = "/assets/workers-stats";
const imgContainer = `${assetPathPrefix}/79592.svg`;
const imgContainer1 = `${assetPathPrefix}/3167a.svg`;
const imgContainer2 = `${assetPathPrefix}/c67f3.svg`;
const imgContainer3 = `${assetPathPrefix}/69130.svg`;
const imgContainer4 = `${assetPathPrefix}/65456.svg`;

export default function Container() {
  const {records}=usePanel();
  return (
    <div className="design-workers-stats-1" data-node-id="8:3375" data-name="Container">
      <div className="design-workers-stats-2" data-node-id="8:3376" data-name="Background+Shadow">
        <div className="design-workers-stats-3" data-node-id="8:3377" data-name="Container">
          <div className="design-workers-stats-4" data-node-id="8:3378" data-name="Container">
            <div className="design-workers-stats-5" data-node-id="8:3379">
              <p className="design-workers-stats-6">TOTAL REGISTERED</p>
            </div>
          </div>
          <div className="design-workers-stats-7" data-node-id="8:3380" data-name="Margin">
            <div className="design-workers-stats-8" data-node-id="8:3381" data-name="Container">
              <div className="design-workers-stats-9" data-node-id="8:3382">
                <p className="design-workers-stats-10">{(1482+records.workers.length).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="design-workers-stats-11" data-node-id="8:3383" data-name="Margin">
            <div className="design-workers-stats-12" data-node-id="8:3384" data-name="Container">
              <div className="design-workers-stats-13" data-node-id="8:3385" data-name="Container">
                <img alt="" className="design-workers-stats-14" src={imgContainer} />
              </div>
              <div className="design-workers-stats-15" data-node-id="8:3387">
                <p className="design-workers-stats-16">+34 this week</p>
              </div>
            </div>
          </div>
        </div>
        <div className="design-workers-stats-17" data-node-id="8:3388" data-name="Background">
          <div className="design-workers-stats-18" data-node-id="8:3389" data-name="Container">
            <img alt="" className="design-workers-stats-19" src={imgContainer1} />
          </div>
        </div>
      </div>
      <div className="design-workers-stats-20" data-node-id="8:3391" data-name="Background+Shadow">
        <div className="design-workers-stats-21" data-node-id="8:3392" data-name="Container">
          <div className="design-workers-stats-22" data-node-id="8:3393" data-name="Container">
            <div className="design-workers-stats-23" data-node-id="8:3394">
              <p className="design-workers-stats-24">AVAILABLE NOW</p>
            </div>
          </div>
          <div className="design-workers-stats-25" data-node-id="8:3395" data-name="Margin">
            <div className="design-workers-stats-26" data-node-id="8:3396" data-name="Container">
              <div className="design-workers-stats-27" data-node-id="8:3397">
                <p className="design-workers-stats-28">{94+records.workers.length}</p>
              </div>
            </div>
          </div>
          <div className="design-workers-stats-29" data-node-id="8:3398" data-name="Margin">
            <div className="design-workers-stats-30" data-node-id="8:3399" data-name="Container">
              <div className="design-workers-stats-31" data-node-id="8:3400">
                <p className="design-workers-stats-32">Ready for 24h dispatch</p>
              </div>
            </div>
          </div>
        </div>
        <div className="design-workers-stats-33" data-node-id="8:3401" data-name="Background">
          <div className="design-workers-stats-34" data-node-id="8:3402" data-name="Container">
            <img alt="" className="design-workers-stats-35" src={imgContainer2} />
          </div>
        </div>
      </div>
      <div className="design-workers-stats-36" data-node-id="8:3404" data-name="Background+Shadow">
        <div className="design-workers-stats-37" data-node-id="8:3405" data-name="Container">
          <div className="design-workers-stats-38" data-node-id="8:3406" data-name="Container">
            <div className="design-workers-stats-39" data-node-id="8:3407">
              <p className="design-workers-stats-40">ACTIVE ON SITE</p>
            </div>
          </div>
          <div className="design-workers-stats-41" data-node-id="8:3408" data-name="Margin">
            <div className="design-workers-stats-42" data-node-id="8:3409" data-name="Container">
              <div className="design-workers-stats-43" data-node-id="8:3410">
                <p className="design-workers-stats-44">1,248</p>
              </div>
            </div>
          </div>
          <div className="design-workers-stats-45" data-node-id="8:3411" data-name="Margin">
            <div className="design-workers-stats-46" data-node-id="8:3412" data-name="Container">
              <div className="design-workers-stats-47" data-node-id="8:3413">
                <p className="design-workers-stats-48">112 VIC Infrastructure sites</p>
              </div>
            </div>
          </div>
        </div>
        <div className="design-workers-stats-49" data-node-id="8:3414" data-name="Background">
          <div className="design-workers-stats-50" data-node-id="8:3415" data-name="Container">
            <img alt="" className="design-workers-stats-51" src={imgContainer3} />
          </div>
        </div>
      </div>
      <div className="design-workers-stats-52" data-node-id="8:3417" data-name="Background+Shadow">
        <div className="design-workers-stats-53" data-node-id="8:3418" data-name="Container">
          <div className="design-workers-stats-54" data-node-id="8:3419" data-name="Container">
            <div className="design-workers-stats-55" data-node-id="8:3420">
              <p className="design-workers-stats-56">AWAITING REVIEW</p>
            </div>
          </div>
          <div className="design-workers-stats-57" data-node-id="8:3421" data-name="Margin">
            <div className="design-workers-stats-58" data-node-id="8:3422" data-name="Container">
              <div className="design-workers-stats-59" data-node-id="8:3423">
                <p className="design-workers-stats-60">28</p>
              </div>
            </div>
          </div>
          <div className="design-workers-stats-61" data-node-id="8:3424" data-name="Margin">
            <div className="design-workers-stats-62" data-node-id="8:3425" data-name="Container">
              <div className="design-workers-stats-63" data-node-id="8:3426">
                <p className="design-workers-stats-64">14 missing documents</p>
              </div>
            </div>
          </div>
        </div>
        <div className="design-workers-stats-65" data-node-id="8:3427" data-name="Overlay">
          <div className="design-workers-stats-66" data-node-id="8:3428" data-name="Container">
            <img alt="" className="design-workers-stats-67" src={imgContainer4} />
          </div>
        </div>
      </div>
    </div>
  );
}

