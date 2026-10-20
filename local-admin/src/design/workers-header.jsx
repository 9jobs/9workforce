import React from 'react';
import {usePanel} from '../state';
const assetPathPrefix = "/assets/workers-header";
const img9WorkForceMasterBrandLogo = `${assetPathPrefix}/665d7.png`;
const imgProfile = `${assetPathPrefix}/52657.png`;
const imgContainer = `${assetPathPrefix}/9b8b1.svg`;
const imgContainer1 = `${assetPathPrefix}/44221.svg`;
const imgIcon = `${assetPathPrefix}/d2c7c.svg`;
const imgContainer2 = `${assetPathPrefix}/3930c.svg`;

export default function Header() {
  const {records}=usePanel();
  return (
    <div className="design-workers-header-1" data-node-id="8:4107" data-name="Header">
      <div className="design-workers-header-2" data-node-id="8:4108" data-name="Container">
        <div className="design-workers-header-3" data-node-id="8:4109" data-name="Container">
          <div className="design-workers-header-4" data-node-id="8:4110" data-name="Container">
            <div className="design-workers-header-5" data-node-id="8:4111" data-name="9Work Force Master Brand Logo">
              <div className="design-workers-header-6">
                <img alt="" className="design-workers-header-7" src={img9WorkForceMasterBrandLogo} />
              </div>
            </div>
            <div className="design-workers-header-8" data-node-id="8:4112" data-name="Container">
              <div className="design-workers-header-9" data-node-id="8:4113">
                <p className="design-workers-header-10">9WORK FORCE</p>
              </div>
            </div>
          </div>
          <div className="design-workers-header-11" data-node-id="8:4114" data-name="Background">
            <div className="design-workers-header-12" data-node-id="8:4115" data-name="Container">
              <img alt="" className="design-workers-header-13" src={imgContainer} />
            </div>
            <div className="design-workers-header-14" data-node-id="8:4117" data-name="Container">
              <div className="design-workers-header-15" data-node-id="8:4118">
                <p className="design-workers-header-16">LABOUR OPS VIC</p>
              </div>
            </div>
          </div>
          <div className="design-workers-header-17" data-node-id="8:4119" data-name="Background">
            <div className="design-workers-header-18" data-node-id="8:4120" data-name="Container">
              <img alt="" className="design-workers-header-19" src={imgContainer1} />
            </div>
            <div className="design-workers-header-20" data-node-id="8:4122" data-name="Container">
              <div className="design-workers-header-21" data-node-id="8:4123">
                <p>
                  <span className="design-workers-header-22">{`Melbourne: `}</span>
                  <span className="design-workers-header-23">10:42 AM AEST</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="design-workers-header-24" data-node-id="8:4124" data-name="Container">
          <div className="design-workers-header-25" data-node-id="8:4125" data-name="Container">
            <div className="design-workers-header-26" data-node-id="8:4126" data-name="Input" data-has-field="true"><input className="design-live-input" aria-label="Search dashboard" placeholder="Search workers, employers, jobs..."/>
              <div className="design-workers-header-27" data-node-id="8:4127" data-name="Container">
                <div className="design-workers-header-28" data-node-id="8:4128">
                  <p className="design-workers-header-29">Search Melbourne workers, white cards, sites, tickets...</p>
                </div>
              </div>
            </div>
            <div className="design-workers-header-30" data-node-id="8:4129" data-name="Icon">
              <img alt="" className="design-workers-header-31" src={imgIcon} />
            </div>
          </div>
        </div>
        <div className="design-workers-header-32" data-node-id="8:4130" data-name="Container">
          <div className="design-workers-header-33" data-node-id="8:4131" data-name="Background">
            <div className="design-workers-header-34" data-node-id="8:4132" data-name="Link" role="button" tabIndex={0} data-ui-action="true">
              <div className="design-workers-header-35" data-node-id="8:4133">
                <p className="design-workers-header-36">Admin</p>
              </div>
            </div>
            <div className="design-workers-header-37" data-node-id="8:4134" data-name="Link" role="button" tabIndex={0} data-ui-action="true">
              <div className="design-workers-header-38" data-node-id="8:4135">
                <p className="design-workers-header-39">Employer</p>
              </div>
            </div>
            <div className="design-workers-header-40" data-node-id="8:4136" data-name="Link" role="button" tabIndex={0} data-ui-action="true">
              <div className="design-workers-header-41" data-node-id="8:4137">
                <p className="design-workers-header-42">Worker</p>
              </div>
            </div>
          </div>
          <div className="design-workers-header-43" data-node-id="8:4138" data-name="Container">
            <div className="design-workers-header-44" data-node-id="8:4139" data-name="Button - Notifications" role="button" tabIndex={0} data-ui-action="true">
              <div className="design-workers-header-45" data-node-id="8:4140" data-name="Container">
                <img alt="" className="design-workers-header-46" src={imgContainer2} />
              </div>
            </div>
            <div className="design-workers-header-47" data-node-id="8:4142" data-name="Background">
              <div className="design-workers-header-48" data-node-id="8:4143" data-name="Overlay+Shadow" />
            </div>
          </div>
          <div className="design-workers-header-49" data-node-id="8:4144" data-name="Container">
            <div className="design-workers-header-50" data-node-id="8:4145" data-name="Profile">
              <div className="design-workers-header-51">
                <img alt="" className="design-workers-header-52" src={imgProfile} />
              </div>
            </div>
            <div className="design-workers-header-53" data-node-id="8:4146" data-name="Container">
              <div className="design-workers-header-54" data-node-id="8:4147" data-name="Container">
                <div className="design-workers-header-55" data-node-id="8:4148">
                  <p className="design-workers-header-56">E. Sutherland</p>
                </div>
              </div>
              <div className="design-workers-header-57" data-node-id="8:4149" data-name="Container">
                <div className="design-workers-header-58" data-node-id="8:4150">
                  <p className="design-workers-header-59">Vic Operations Lead</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

