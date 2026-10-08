import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, FileText, CheckCircle2, AlertCircle, Phone, Mail, Building2, Scale } from 'lucide-react';
import './legal-policies.css';

export default function LegalPolicies({ initialTab = 'modern-slavery' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('privacy')) {
      setActiveTab('privacy');
    } else if (location.pathname.includes('workcover')) {
      setActiveTab('workcover');
    } else if (location.pathname.includes('modern-slavery')) {
      setActiveTab('modern-slavery');
    } else {
      setActiveTab(initialTab);
    }
  }, [location.pathname, initialTab]);

  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <span className="legal-eyebrow">
            <Scale size={14} /> Corporate Governance &amp; Compliance
          </span>
          <h1>
            Compliance &amp; <em>Legal Policies</em>
          </h1>
          <p>
            9 JOBS PTY. LTD. trading as 9Work Force is dedicated to the highest standards of safety,
            ethical employment, transparency, and statutory compliance across Victoria.
          </p>

          <div className="legal-nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'modern-slavery'}
              className={`legal-tab-btn${activeTab === 'modern-slavery' ? ' active' : ''}`}
              onClick={() => setActiveTab('modern-slavery')}
            >
              <ShieldCheck size={16} /> Modern Slavery Statement
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              className={`legal-tab-btn${activeTab === 'privacy' ? ' active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Lock size={16} /> Privacy Policy
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'workcover'}
              className={`legal-tab-btn${activeTab === 'workcover' ? ' active' : ''}`}
              onClick={() => setActiveTab('workcover')}
            >
              <FileText size={16} /> WorkCover Terms
            </button>
          </div>
        </div>
      </section>

      <div className="legal-content-wrap">
        {activeTab === 'modern-slavery' && (
          <article className="legal-card">
            <div className="legal-card-header">
              <div>
                <span className="legal-badge-pill">
                  <ShieldCheck size={13} /> Modern Slavery Act 2018 (Cth)
                </span>
                <h2>Modern Slavery Statement</h2>
                <div className="legal-meta-info">
                  Entity: <strong>9 JOBS PTY. LTD.</strong> trading as <strong>9Work Force</strong> | Victoria, Australia
                </div>
              </div>
            </div>

            <div className="legal-section-block">
              <h3><Building2 size={18} /> 1. Commitment &amp; Zero-Tolerance Policy</h3>
              <p>
                9 JOBS PTY. LTD. trading as 9Work Force takes a zero-tolerance approach to modern slavery, human trafficking,
                forced labour, servitude, and deceptive recruiting practices. We are committed to acting ethically and with
                integrity in all our business dealings and relationships across Melbourne and Victoria.
              </p>
              <p>
                As an Australian labour hire and recruitment agency supplying construction workers, civil personnel, traffic
                management staff, and trade assistants, we acknowledge our responsibility to identify, mitigate, and eliminate
                any risks of worker exploitation.
              </p>
            </div>

            <div className="legal-callout-box">
              <p>
                <strong>Statutory Standard:</strong> All recruitment and placement processes operate strictly in accordance
                with the <em>Fair Work Act 2009</em>, applicable Modern Awards (including the <em>Building and Construction General
                On-site Award</em>), and Victorian labour hire legislation.
              </p>
            </div>

            <div className="legal-section-block">
              <h3><CheckCircle2 size={18} /> 2. Ethical Recruitment &amp; Due Diligence</h3>
              <p>To ensure worker protection and prevent unlawful practices, 9Work Force enforces the following protocols:</p>
              <ul className="legal-list">
                <li>
                  <strong>Direct Engagement:</strong> We recruit and communicate directly with candidates. No recruitment fees or placement charges are ever levied on job seekers or workers.
                </li>
                <li>
                  <strong>Work Rights Verification:</strong> All candidates undergo thorough identity and Australian work-rights verification (using Department of Home Affairs VEVO checks) prior to assignment.
                </li>
                <li>
                  <strong>Transparent Terms &amp; Fair Pay:</strong> Every worker receives clear terms of engagement, transparent pay slips detailing award hourly rates, superannuation, and allowances without unlawful deductions.
                </li>
                <li>
                  <strong>No Document Retention:</strong> Passports, visas, identification cards, and personal bank cards remain in the worker’s custody at all times; we never confiscate or withhold personal documents.
                </li>
                <li>
                  <strong>Host Employer Vetting:</strong> We partner only with reputable contractors and builders who demonstrate compliance with Australian Occupational Health and Safety (OHS) standards and ethical employment benchmarks.
                </li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3><AlertCircle size={18} /> 3. Reporting, Grievances &amp; Whistleblowing</h3>
              <p>
                We maintain open, confidential reporting channels for workers, host employers, or site supervisors who suspect
                any form of unfair treatment, coercion, or modern slavery. All reports are investigated promptly without fear of reprisal.
              </p>
              <div className="legal-contact-callout">
                <div>
                  <h4>Compliance &amp; Ethics Officer</h4>
                  <p>Confidential reporting and enquiries regarding employment standards:</p>
                </div>
                <div className="legal-contact-btns">
                  <a className="legal-pill-btn secondary" href="mailto:support@9workforce.com.au">
                    <Mail size={14} /> support@9workforce.com.au
                  </a>
                  <a className="legal-pill-btn primary" href="tel:+61422279428">
                    <Phone size={14} /> +61 422 279 428
                  </a>
                </div>
              </div>
            </div>
          </article>
        )}

        {activeTab === 'privacy' && (
          <article className="legal-card">
            <div className="legal-card-header">
              <div>
                <span className="legal-badge-pill">
                  <Lock size={13} /> Privacy Act 1988 (Cth) &amp; APPs
                </span>
                <h2>Privacy Policy</h2>
                <div className="legal-meta-info">
                  Last Updated: 2025 | Applicable across all 9Work Force digital platforms and operations
                </div>
              </div>
            </div>

            <div className="legal-section-block">
              <h3><Building2 size={18} /> 1. Overview</h3>
              <p>
                9 JOBS PTY. LTD. (trading as 9Work Force) is committed to safeguarding personal information in accordance with the
                <em>Privacy Act 1988 (Cth)</em> and the Australian Privacy Principles (APPs). This Privacy Policy explains how we
                collect, store, use, and protect your personal information when you use our website or register for work.
              </p>
            </div>

            <div className="legal-section-block">
              <h3><FileText size={18} /> 2. Personal Information We Collect</h3>
              <p>We collect information reasonably necessary to provide labour hire and recruitment services, including:</p>
              <ul className="legal-list">
                <li>
                  <strong>Candidate Details:</strong> Full name, telephone number, email address, residential suburb/location in Victoria, resume/CV, work history, and referee details.
                </li>
                <li>
                  <strong>Credentials &amp; Licences:</strong> White Card (CPCWHS1001 / CPCCWHS1001), high-risk work licences, forklift/traffic control tickets, trade certifications, and visa/work rights status.
                </li>
                <li>
                  <strong>Placement &amp; Payroll Data:</strong> Tax File Number (TFN declaration), superannuation fund details, emergency contact information, and bank details upon placement.
                </li>
                <li>
                  <strong>Client &amp; Employer Data:</strong> Company contact details, site location, staffing requirements, and site safety inductions.
                </li>
              </ul>
            </div>

            <div className="legal-section-block">
              <h3><CheckCircle2 size={18} /> 3. How We Use &amp; Disclose Information</h3>
              <p>Your personal information is used exclusively for:</p>
              <ul className="legal-list">
                <li>Assessing qualification and suitability for construction, civil, and industrial roles in Victoria.</li>
                <li>Contacting you with appropriate work opportunities matching your tickets and location.</li>
                <li>Sharing essential credentials (e.g. White Card, tickets, contact name) with host employers for site access and safety coordination.</li>
                <li>Fulfilling legal obligations under Australian taxation, workplace relations, and WorkCover legislation.</li>
              </ul>
              <div className="legal-callout-box">
                <p>
                  <strong>No Commercial Sale of Data:</strong> We do not sell, rent, or lease personal information to any third parties
                  or external marketing organisations under any circumstances.
                </p>
              </div>
            </div>

            <div className="legal-section-block">
              <h3><Lock size={18} /> 4. Data Storage, Security &amp; Access</h3>
              <p>
                All electronic records are secured using industry-standard encryption, firewalls, and restricted user access controls.
                You have the right to request access to personal information we hold about you and request corrections if any details
                are inaccurate.
              </p>
              <div className="legal-contact-callout">
                <div>
                  <h4>Privacy Inquiries &amp; Data Requests</h4>
                  <p>To request access to or correction of your personal information:</p>
                </div>
                <div className="legal-contact-btns">
                  <a className="legal-pill-btn secondary" href="mailto:support@9workforce.com.au">
                    <Mail size={14} /> support@9workforce.com.au
                  </a>
                  <Link className="legal-pill-btn primary" to="/contact">
                    Contact Privacy Team
                  </Link>
                </div>
              </div>
            </div>
          </article>
        )}

        {activeTab === 'workcover' && (
          <article className="legal-card">
            <div className="legal-card-header">
              <div>
                <span className="legal-badge-pill">
                  <ShieldCheck size={13} /> WorkSafe Victoria &amp; OHS Act 2004 (Vic)
                </span>
                <h2>WorkCover &amp; Safety Terms</h2>
                <div className="legal-meta-info">
                  Applicable to all on-hire workers, host employers, and worksites across Victoria
                </div>
              </div>
            </div>

            <div className="legal-section-block">
              <h3><Building2 size={18} /> 1. WorkCover Insurance Coverage</h3>
              <p>
                All on-hire employees engaged by 9 JOBS PTY. LTD. (trading as 9Work Force) are covered under Victorian
                workers' compensation legislation (*Workplace Injury Rehabilitation and Compensation Act 2013 (Vic)*)
                administered by <strong>WorkSafe Victoria</strong>.
              </p>
              <p>
                Coverage applies to work-related injuries or illnesses sustained by eligible workers while carrying out
                authorised duties on assigned host employer sites.
              </p>
            </div>

            <div className="legal-section-block">
              <h3><Scale size={18} /> 2. Shared OHS Duties (Host Employer &amp; Agency)</h3>
              <p>
                Under Victorian Occupational Health and Safety (OHS) legislation, both 9Work Force and host employer clients
                hold concurrent, non-delegable duties of care for on-site worker safety:
              </p>
              <ul className="legal-list">
                <li>
                  <strong>Site Inductions:</strong> Host employers must conduct site-specific and task-specific safety inductions before any worker begins work.
                </li>
                <li>
                  <strong>Safe Working Environment:</strong> Host employers must provide safe working conditions, well-maintained plant and equipment, adequate amenities, and appropriate supervision.
                </li>
                <li>
                  <strong>Scope of Work:</strong> Workers must only perform tasks for which they have been briefed, risk-assessed, and hold valid tickets/competencies. Workers must not be assigned to higher-risk tasks without written consultation with 9Work Force.
                </li>
                <li>
                  <strong>Personal Protective Equipment (PPE):</strong> Workers must wear mandated PPE (steel-capped safety boots, high-vis clothing, hard hat, safety glasses, and ear protection where required).
                </li>
              </ul>
            </div>

            <div className="legal-callout-box">
              <p>
                <strong>Worker Safety Right:</strong> Every worker has the statutory right and duty to cease work immediately
                if they reasonably believe there is an immediate risk to their health and safety, and inform site supervisors and 9Work Force.
              </p>
            </div>

            <div className="legal-section-block">
              <h3><AlertCircle size={18} /> 3. Incident, Injury &amp; Near-Miss Reporting Protocol</h3>
              <p>In the event of any workplace incident, injury, or dangerous near miss on site:</p>
              <ul className="legal-list">
                <li><strong>Step 1:</strong> Administer first aid or arrange emergency medical care immediately.</li>
                <li><strong>Step 2:</strong> Notify the host employer's site manager or safety supervisor immediately.</li>
                <li><strong>Step 3:</strong> Report the incident to 9Work Force management within 24 hours via telephone or email.</li>
                <li><strong>Step 4:</strong> Complete the incident investigation report to facilitate rapid medical treatment, WorkSafe compliance, and structured return-to-work support.</li>
              </ul>

              <div className="legal-contact-callout">
                <div>
                  <h4>Emergency &amp; Incident Hotline</h4>
                  <p>Immediate reporting of site incidents or safety concerns:</p>
                </div>
                <div className="legal-contact-btns">
                  <a className="legal-pill-btn primary" href="tel:+61422279428">
                    <Phone size={14} /> +61 422 279 428
                  </a>
                  <a className="legal-pill-btn secondary" href="mailto:support@9workforce.com.au">
                    <Mail size={14} /> support@9workforce.com.au
                  </a>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
