import React from 'react';
import {usePanel} from '../state';
const assetPathPrefix = "/assets/workers-footer";
const imgContainer = `${assetPathPrefix}/b5b7f.svg`;
const imgContainer1 = `${assetPathPrefix}/05436.svg`;
const imgContainer2 = `${assetPathPrefix}/96937.svg`;

export default function Container() {
  const {records}=usePanel();
  return (
    <div className="design-workers-footer-1" data-node-id="8:3962" data-name="Container">
      <div className="design-workers-footer-2" data-node-id="8:3963" data-name="Background+Shadow">
        <div className="design-workers-footer-3" data-node-id="8:3964" data-name="Container">
          <div className="design-workers-footer-4" data-node-id="8:3965" data-name="Container">
            <div className="design-workers-footer-5" data-node-id="8:3966" data-name="Container">
              <div className="design-workers-footer-6" data-node-id="8:3967" data-name="Container">
                <img alt="" className="design-workers-footer-7" src={imgContainer} />
              </div>
              <div className="design-workers-footer-8" data-node-id="8:3969">
                <p className="design-workers-footer-9">WORKSAFE VICTORIA COMPLIANCE ENGINE</p>
              </div>
            </div>
            <div className="design-workers-footer-10" data-node-id="8:3970" data-name="Background">
              <div className="design-workers-footer-11" data-node-id="8:3971">
                <p className="design-workers-footer-12">Active API</p>
              </div>
            </div>
          </div>
          <div className="design-workers-footer-13" data-node-id="8:3972" data-name="Container">
            <div className="design-workers-footer-14" data-node-id="8:3973">
              <p className="design-workers-footer-15">Every candidate is checked nightly against WorkSafe Victoria’s</p>
              <p className="design-workers-footer-16">White Card registry and High Risk Work Licence database.</p>
              <p className="design-workers-footer-17">Automated SMS alerts are sent 30 days prior to expiry.</p>
            </div>
          </div>
        </div>
        <div className="design-workers-footer-18" data-node-id="8:3974" data-name="Margin">
          <div className="design-workers-footer-19" data-node-id="8:3975" data-name="Container">
            <div className="design-workers-footer-20" data-node-id="8:3976" data-name="Container">
              <div className="design-workers-footer-21" data-node-id="8:3977" data-name="Container">
                <div className="design-workers-footer-22" data-node-id="8:3978">
                  <p className="design-workers-footer-23">99.1%</p>
                </div>
              </div>
              <div className="design-workers-footer-24" data-node-id="8:3979" data-name="Container">
                <div className="design-workers-footer-25" data-node-id="8:3980">
                  <p className="design-workers-footer-26">Current Compliance Rate</p>
                </div>
              </div>
            </div>
            <div className="design-workers-footer-27" data-node-id="8:3981" data-name="Vertical Divider" />
            <div className="design-workers-footer-28" data-node-id="8:3982" data-name="Container">
              <div className="design-workers-footer-29" data-node-id="8:3983" data-name="Container">
                <div className="design-workers-footer-30" data-node-id="8:3984">
                  <p className="design-workers-footer-31">14</p>
                </div>
              </div>
              <div className="design-workers-footer-32" data-node-id="8:3985" data-name="Container">
                <div className="design-workers-footer-33" data-node-id="8:3986">
                  <p className="design-workers-footer-34">Pending WorkSafe Audits</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="design-workers-footer-35" data-node-id="8:3987" data-name="Background+Shadow">
        <div className="design-workers-footer-36" data-node-id="8:3988" data-name="Container">
          <div className="design-workers-footer-37" data-node-id="8:3989" data-name="Container">
            <div className="design-workers-footer-38" data-node-id="8:3990" data-name="Container">
              <div className="design-workers-footer-39" data-node-id="8:3991" data-name="Container">
                <img alt="" className="design-workers-footer-40" src={imgContainer1} />
              </div>
              <div className="design-workers-footer-41" data-node-id="8:3993">
                <p className="design-workers-footer-42">VICTORIAN LABOUR HIRE AUTHORITY (LHA) LICENCE</p>
              </div>
            </div>
            <div className="design-workers-footer-43" data-node-id="8:3994" data-name="Container">
              <div className="design-workers-footer-44" data-node-id="8:3995">
                <p className="design-workers-footer-45">VIC-LHA-449102</p>
              </div>
            </div>
          </div>
          <div className="design-workers-footer-46" data-node-id="8:3996" data-name="Container">
            <div className="design-workers-footer-47" data-node-id="8:3997">
              <p className="design-workers-footer-48">9Work Force operates strictly under the Labour Hire Licensing Act</p>
              <p className="design-workers-footer-49">2018 (Vic). All workers deployed are paid under applicable Modern</p>
              <p className="design-workers-footer-50">{`Awards (Building & Construction General On-site Award).`}</p>
            </div>
          </div>
        </div>
        <div className="design-workers-footer-51" data-node-id="8:3998" data-name="Margin">
          <div className="design-workers-footer-52" data-node-id="8:3999" data-name="Container">
            <div className="design-workers-footer-53" data-node-id="8:4000" data-name="Container">
              <div className="design-workers-footer-54" data-node-id="8:4001">
                <p className="design-workers-footer-55">Last WorkSafe VIC Sync: Today, 08:30 AM AEST</p>
              </div>
            </div>
            <div className="design-workers-footer-56" data-node-id="8:4002" data-name="Button" role="button" tabIndex={0} data-ui-action="true">
              <div className="design-workers-footer-57" data-node-id="8:4003" data-name="Container">
                <div className="design-workers-footer-58" data-node-id="8:4004">
                  <p className="design-workers-footer-59">Audit Logs</p>
                </div>
              </div>
              <div className="design-workers-footer-60" data-node-id="8:4005" data-name="Container">
                <img alt="" className="design-workers-footer-61" src={imgContainer2} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

