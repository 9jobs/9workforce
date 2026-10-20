import React from 'react';
import {usePanel} from '../state';
const assetPathPrefix = "/assets/workers-heading";
const imgContainer = `${assetPathPrefix}/834a6.svg`;
const imgContainer1 = `${assetPathPrefix}/bbbbe.svg`;
const imgContainer2 = `${assetPathPrefix}/692bb.svg`;
const imgContainer3 = `${assetPathPrefix}/25176.svg`;

export default function Container() {
  const {records}=usePanel();
  return (
    <div className="design-workers-heading-1" data-node-id="8:3340" data-name="Container">
      <div className="design-workers-heading-2" data-node-id="8:3341" data-name="Container">
        <div className="design-workers-heading-3" data-node-id="8:3342" data-name="Container">
          <div className="design-workers-heading-4" data-node-id="8:3343" data-name="Container">
            <div className="design-workers-heading-5" data-node-id="8:3344">
              <p className="design-workers-heading-6">LABOUR OPS VICTORIA</p>
            </div>
          </div>
          <div className="design-workers-heading-7" data-node-id="8:3345" data-name="Container">
            <div className="design-workers-heading-8" data-node-id="8:3346">
              <p className="design-workers-heading-9">/</p>
            </div>
          </div>
          <div className="design-workers-heading-10" data-node-id="8:3347" data-name="Container">
            <div className="design-workers-heading-11" data-node-id="8:3348">
              <p className="design-workers-heading-12">Workforce Registry</p>
            </div>
          </div>
        </div>
        <div className="design-workers-heading-13" data-node-id="8:3349" data-name="Heading 1" role="heading" aria-level={1}>
          <div className="design-workers-heading-14" data-node-id="8:3350">
            <p className="design-workers-heading-15">Victorian Worker Repository</p>
          </div>
        </div>
        <div className="design-workers-heading-16" data-node-id="8:3351" data-name="Container">
          <div className="design-workers-heading-17" data-node-id="8:3352">
            <p className="design-workers-heading-18">Accreditation, ticket verification, and real-time site deployment roster for commercial and</p>
            <p className="design-workers-heading-19">infrastructure works across Greater Melbourne and Regional VIC.</p>
          </div>
        </div>
      </div>
      <div className="design-workers-heading-20" data-node-id="8:3353" data-name="Container">
        <div className="design-workers-heading-21" data-node-id="8:3354" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-heading-22" data-node-id="8:3355" data-name="Container">
            <img alt="" className="design-workers-heading-23" src={imgContainer} />
          </div>
          <div className="design-workers-heading-24" data-node-id="8:3357" data-name="Container">
            <div className="design-workers-heading-25" data-node-id="8:3358">
              <p className="design-workers-heading-26">Saved Views</p>
            </div>
          </div>
        </div>
        <div className="design-workers-heading-27" data-node-id="8:3359" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-heading-28" data-node-id="8:3360" data-name="Container">
            <img alt="" className="design-workers-heading-29" src={imgContainer1} />
          </div>
          <div className="design-workers-heading-30" data-node-id="8:3362" data-name="Container">
            <div className="design-workers-heading-31" data-node-id="8:3363">
              <p className="design-workers-heading-32">Import CSV</p>
            </div>
          </div>
        </div>
        <div className="design-workers-heading-33" data-node-id="8:3364" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-heading-34" data-node-id="8:3365" data-name="Container">
            <img alt="" className="design-workers-heading-35" src={imgContainer2} />
          </div>
          <div className="design-workers-heading-36" data-node-id="8:3367" data-name="Container">
            <div className="design-workers-heading-37" data-node-id="8:3368">
              <p className="design-workers-heading-38">Export Permitted</p>
            </div>
          </div>
        </div>
        <div className="design-workers-heading-39" data-node-id="8:3369" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-heading-40" data-node-id="8:3370" data-name="Button:shadow" />
          <div className="design-workers-heading-41" data-node-id="8:3371" data-name="Container">
            <img alt="" className="design-workers-heading-42" src={imgContainer3} />
          </div>
          <div className="design-workers-heading-43" data-node-id="8:3373" data-name="Container">
            <div className="design-workers-heading-44" data-node-id="8:3374">
              <p className="design-workers-heading-45">Add Worker</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

