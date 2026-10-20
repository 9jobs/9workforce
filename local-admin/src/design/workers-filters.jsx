import React from 'react';
import {usePanel} from '../state';
const assetPathPrefix = "/assets/workers-filters";
const imgIcon = `${assetPathPrefix}/d2c7c.svg`;

export default function BackgroundShadow() {
  const {records}=usePanel();
  return (
    <div className="design-workers-filters-1" data-node-id="8:3430" data-name="Background+Shadow">
      <div className="design-workers-filters-2" data-node-id="8:3431" data-name="Container">
        <div className="design-workers-filters-3" data-node-id="8:3432" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-filters-4" data-node-id="8:3433" data-name="Container">
            <div className="design-workers-filters-5" data-node-id="8:3434">
              <p className="design-workers-filters-6">All Workers</p>
            </div>
          </div>
          <div className="design-workers-filters-7" data-node-id="8:3435" data-name="Overlay">
            <div className="design-workers-filters-8" data-node-id="8:3436">
              <p className="design-workers-filters-9">1,482</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-10" data-node-id="8:3437" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-filters-11" data-node-id="8:3438" data-name="Container">
            <div className="design-workers-filters-12" data-node-id="8:3439">
              <p className="design-workers-filters-13">Available Now</p>
            </div>
          </div>
          <div className="design-workers-filters-14" data-node-id="8:3440" data-name="Background">
            <div className="design-workers-filters-15" data-node-id="8:3441">
              <p className="design-workers-filters-16">94</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-17" data-node-id="8:3442" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-filters-18" data-node-id="8:3443" data-name="Container">
            <div className="design-workers-filters-19" data-node-id="8:3444">
              <p className="design-workers-filters-20">Awaiting Credential Review</p>
            </div>
          </div>
          <div className="design-workers-filters-21" data-node-id="8:3445" data-name="Background">
            <div className="design-workers-filters-22" data-node-id="8:3446">
              <p className="design-workers-filters-23">28</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-24" data-node-id="8:3447" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-filters-25" data-node-id="8:3448" data-name="Container">
            <div className="design-workers-filters-26" data-node-id="8:3449">
              <p className="design-workers-filters-27">Missing Documents</p>
            </div>
          </div>
          <div className="design-workers-filters-28" data-node-id="8:3450" data-name="Background">
            <div className="design-workers-filters-29" data-node-id="8:3451">
              <p className="design-workers-filters-30">14</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-31" data-node-id="8:3452" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
          <div className="design-workers-filters-32" data-node-id="8:3453" data-name="Container">
            <div className="design-workers-filters-33" data-node-id="8:3454">
              <p className="design-workers-filters-34">Inactive / On Leave</p>
            </div>
          </div>
          <div className="design-workers-filters-35" data-node-id="8:3455" data-name="Background">
            <div className="design-workers-filters-36" data-node-id="8:3456">
              <p className="design-workers-filters-37">92</p>
            </div>
          </div>
        </div>
      </div>
      <div className="design-workers-filters-38" data-node-id="8:3457" data-name="Container">
        <div className="design-workers-filters-39" data-node-id="8:3458" data-name="Options" data-has-field="true"><select className="design-live-select" aria-label="All Trades" data-worker-filter="trade"><option value="">All Trades</option><option value="Civil Labourer">Civil Labourer</option><option value="Carpenter">Carpenter</option><option value="Scaffolder">Scaffolder</option><option value="Electrician">Electrician</option><option value="Trade Assistant">Trade Assistant</option></select>
          <div className="design-workers-filters-40" data-node-id="8:3459" data-name="Container">
            <div className="design-workers-filters-41" data-node-id="8:3460">
              <p className="design-workers-filters-42">All Trades</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-43" data-node-id="8:3461" data-name="Options" data-has-field="true"><select className="design-live-select" aria-label="Victorian Region" data-worker-filter="region"><option value="">Victorian Region</option><option value="Melbourne">Melbourne</option><option value="Geelong">Geelong</option><option value="Ballarat">Ballarat</option><option value="Bendigo">Bendigo</option></select>
          <div className="design-workers-filters-44" data-node-id="8:3462" data-name="Container">
            <div className="design-workers-filters-45" data-node-id="8:3463">
              <p className="design-workers-filters-46">Victorian Region</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-47" data-node-id="8:3464" data-name="Options" data-has-field="true"><select className="design-live-select" aria-label="Availability Status" data-worker-filter="availability"><option value="">Availability Status</option><option value="Available Now">Available Now</option><option value="Currently on Site">Currently on Site</option><option value="Unavailable">Unavailable</option></select>
          <div className="design-workers-filters-48" data-node-id="8:3465" data-name="Container">
            <div className="design-workers-filters-49" data-node-id="8:3466">
              <p className="design-workers-filters-50">Availability Status</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-51" data-node-id="8:3467" data-name="Options" data-has-field="true"><select className="design-live-select" aria-label="Credential Status" data-worker-filter="credential"><option value="">Credential Status</option><option value="Verified">Verified</option><option value="Pending">Pending</option><option value="Expired">Expired</option></select>
          <div className="design-workers-filters-52" data-node-id="8:3468" data-name="Container">
            <div className="design-workers-filters-53" data-node-id="8:3469">
              <p className="design-workers-filters-54">Credential Status</p>
            </div>
          </div>
        </div>
        <div className="design-workers-filters-55" data-node-id="8:3470" data-name="Container">
          <div className="design-workers-filters-56" data-node-id="8:3471" data-name="Input" data-has-field="true"><input className="design-live-input" aria-label="Search dashboard" placeholder="Search workers, employers, jobs..."/>
            <div className="design-workers-filters-57" data-node-id="8:3472" data-name="Container">
              <div className="design-workers-filters-58" data-node-id="8:3473">
                <p className="design-workers-filters-59">Search by name, ID (e.g. WF-9024), phone, ticket...</p>
              </div>
            </div>
          </div>
          <div className="design-workers-filters-60" data-node-id="8:3474" data-name="Icon">
            <img alt="" className="design-workers-filters-61" src={imgIcon} />
          </div>
        </div>
      </div>
    </div>
  );
}

