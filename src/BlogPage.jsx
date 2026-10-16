import React from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import {ArrowRight, Check, ChevronDown} from 'lucide-react';
import {motion, useReducedMotion} from 'framer-motion';
import {blogPosts, articleContent, featuredCopy} from './blogData';
import './blog-page.css';
import {socialLinks} from './socialLinks';

const postPath = post => `/blog/${post.slug}`;
const BlogVector = ({name}) => <img className="blog-icon" src={`/assets/blog/${name}.svg`} alt="" aria-hidden="true"/>;
const AssetIcon = ({number, ...props}) => <img className="blog-icon" src={`/assets/blog/icon-${number}.svg`} alt="" aria-hidden="true" {...props}/>;

const CollageLink = motion.create(Link);
function BlogInsightsCollage({posts}) {
  const reduceMotion = useReducedMotion();
  return <motion.div className="blog-insights-collage" aria-label="Construction workforce and site insights" initial={reduceMotion?false:'hidden'} whileInView="visible" viewport={{once:true,amount:.35}}>
    {posts.map((item,index)=><CollageLink className={`blog-insights-photo blog-insights-photo-${index+1}`} to={postPath(item)} key={item.slug} aria-label={`Read ${item.title}`} variants={{hidden:{opacity:0,rotateY:-110,y:24,scale:.94},visible:{opacity:1,rotateY:0,y:0,scale:1}}} transition={{duration:reduceMotion?0:1,ease:[.22,1,.36,1]}}><img src={item.image} alt={item.title} loading="lazy"/></CollageLink>)}
  </motion.div>;
}

function BlogCTA() {
  return <section className="blog-cta" aria-labelledby="blog-cta-heading"><div>
    <h2 id="blog-cta-heading">Need construction workers for your<br/>next project?</h2>
    <p>Share your project and workforce requirements with the 9 Work Force team.<br/>From general labourers to skilled site support, we help match suitable workers to construction sites across Melbourne and Victoria.</p>
    <div className="blog-cta-notes"><span><BlogVector name="list-vector-12"/>VIC Labour Hire Authority Licensed</span><span><BlogVector name="list-vector-13"/>Site-ready workforce support</span><span><BlogVector name="list-vector-8"/>Clear site preparation</span></div>
  </div><div className="blog-cta-actions"><Link className="btn orange" to="/request-workers">Request Workers <ArrowRight size={14}/></Link><Link className="btn light" to="/find-work#register">Register for Work</Link></div></section>;
}

export default function BlogPage() {
  const posts = blogPosts;
  return <main className="blog-page">
    <section className="blog-intro"><div className="blog-wrap"><h1>Construction Insights &amp; Updates.</h1><p>Practical insights on construction labour hire, workforce requirements, site safety and<br className="blog-desktop-break"/> industry developments across Melbourne and Victoria.</p><div className="blog-verification"><span><AssetIcon number={1}/>Construction workforce insights</span><b>•</b><small>For builders, contractors and construction workers</small></div></div></section>
    <section className="blog-wrap blog-listing" aria-label="Construction articles"><div className="blog-posts" aria-live="polite">{posts.map(post=><article className="blog-card" key={post.slug}><Link className="blog-card-photo" to={postPath(post)} aria-label={`Read ${post.title}`}><img src={post.image} alt={post.title} loading="lazy"/></Link><div className="blog-card-copy"><div className="blog-meta"><span className="blog-category">{post.category}</span></div><h2><Link to={postPath(post)}>{post.title}</Link></h2><p>{post.summary}</p><div className="blog-card-actions"><span><img className="blog-icon" src={post.icon} alt="" aria-hidden="true"/>{post.tag}</span><Link className="blog-read" to={postPath(post)}>Read Article <BlogVector name="list-vector-6"/></Link></div></div></article>)}</div><div className="blog-pagination"><p>Showing <strong>{posts.length}</strong> of <strong>{blogPosts.length}</strong> articles across Victoria</p><nav aria-label="Article pages"><button type="button" disabled>Previous</button><button type="button" aria-current="page">1</button><button type="button" disabled>Next</button></nav></div><BlogCTA/></section>
  </main>;
}

function ArticleShare() {
  return <div className="blog-share"><strong><BlogVector name="article-vector-6"/>Connect With Us</strong><div><a href={socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn</a><a href={socialLinks.whatsapp} target="_blank" rel="noreferrer">WhatsApp</a><a href={socialLinks.instagram} target="_blank" rel="noreferrer">Instagram</a></div></div>;
}

export function BlogArticle() {
  const {slug} = useParams();
  const post = blogPosts.find(item=>item.slug===slug);
  if(!post)return <Navigate to="/blog" replace/>;
  const featured=post===blogPosts[0];
  const sections=articleContent[post.slug].map((section,index)=>({...section,original:index}));
  const hero = <figure className="blog-article-hero blog-angular-hero" aria-label={post.heroAlt}><div className="blog-angular-photo"><img src={post.heroImage} alt={post.heroAlt}/></div><span className="blog-angular-accent" aria-hidden="true"/></figure>;
  return <main className="blog-page blog-article-page blog-article-editorial">
    <header className="blog-editorial-banner"><div className="blog-wrap blog-editorial-header"><div className="blog-editorial-intro"><span className="blog-eyebrow">{featured?'CONSTRUCTION INSIGHTS':post.category}</span><h1>{post.title}</h1><p>{featured?featuredCopy.intro:post.summary}</p></div>{hero}</div></header>
    <div className="blog-wrap">
      <div className="blog-article-grid"><article className="blog-body"><details className="blog-mobile-toc"><summary>In this article <ChevronDown size={15}/></summary><ol>{sections.map((section,index)=><li key={section.title}><a href={`#article-section-${index+1}`}>{section.title.replace(/^\d+\. /,'')}</a></li>)}</ol></details>{sections.map((section,index)=><section className="blog-prose-section" id={`article-section-${index+1}`} key={section.title}><span className="blog-eyebrow">{section.eyebrow}</span><h2>{section.title.replace(/^\d+\. /,'')}</h2>{section.paragraphs.map((paragraph,i)=><React.Fragment key={paragraph}><p>{paragraph}</p>{featured&&section.original===1&&i===0&&<aside className="blog-takeaway"><span className="blog-takeaway-icon"><BlogVector name="article-vector-12"/></span><div><h3>Key Industry Takeaway</h3><p>{featuredCopy.takeaway}</p></div></aside>}</React.Fragment>)}{featured&&section.original===3&&<blockquote><span>“</span><p>{featuredCopy.quote.replace(/^"|"$/g,'')}</p><cite><strong>{featuredCopy.quoteAuthor}</strong> {featuredCopy.quoteRole}</cite></blockquote>}{featured&&section.original===4&&<figure className="blog-inline-photo"><img src="/assets/toolbox-talk.webp" alt="Construction crew receiving a site safety briefing" loading="lazy"/><figcaption>{featuredCopy.inlineCaption}<small>Site coordination</small></figcaption></figure>}</section>)}<div className="blog-editorial-mobile-share"><ArticleShare/></div></article>
        <aside className="blog-sidebar"><nav className="blog-toc" aria-label="Table of contents"><h2><BlogVector name="article-vector-20"/>On this page</h2><ol>{sections.map((section,index)=><li key={section.title}><a href={`#article-section-${index+1}`}>{section.title.replace(/^\d+\. /,'')}</a></li>)}</ol></nav><section className="blog-key-takeaways" aria-labelledby="blog-key-takeaways-title"><h2 id="blog-key-takeaways-title">Key takeaways</h2><ul>{post.takeaways.map((point,index)=><li key={point}><BlogVector name={['article-vector-12','article-vector-3','article-vector-11','article-vector-1'][index]}/>{point}</li>)}</ul></section><div className="blog-side-cta"><span className="blog-eyebrow">ON-DEMAND CREWS</span><h2>Require Labour for Your Site?</h2><p>Share your role, site location and schedule. We help builders and contractors across Melbourne and Victoria coordinate suitable construction workers.</p><ul><li><BlogVector name="article-vector-3"/>Experience matched to site requirements</li><li><BlogVector name="article-vector-11"/>Relevant worker details reviewed</li><li><BlogVector name="article-vector-1"/>Worker communication &amp; placement support</li></ul><Link className="btn orange" to="/request-workers">Request Workers <ArrowRight size={12}/></Link></div><ArticleShare/></aside>
      </div>
    </div><section className="blog-related" aria-labelledby="blog-related-title"><div className="blog-wrap">
      <div className="blog-insights-intro"><div className="blog-insights-copy"><span className="blog-eyebrow">INSIGHTS &amp; PERSPECTIVES</span><h2>Practical knowledge.<br/>Stronger worksites.</h2><p>Explore insights on construction labour hire, site safety and workforce planning across Melbourne and Victoria.</p><ul><li><Check size={16}/>Understand your workforce requirements</li><li><Check size={16}/>Keep site safety front of mind</li><li><Check size={16}/>Plan your next project with confidence</li></ul><Link className="blog-insights-link" to="/blog">Explore all insights <ArrowRight size={16}/></Link></div>
      <BlogInsightsCollage posts={blogPosts.filter(item=>item!==post).slice(0,3)}/></div>
      <div className="blog-related-heading"><div><span className="blog-eyebrow">BUILT ON INDUSTRY KNOWLEDGE</span><h2 id="blog-related-title">Continue Reading</h2><p>Explore more insights on Australian construction labour hire and safety.</p></div><Link to="/blog">View all industry insights <ArrowRight size={14}/></Link></div>
      <div className="blog-related-grid">{blogPosts.filter(item=>item!==post).slice(0,3).map(item=><article key={item.slug}><div><span className="blog-category">{item.category}</span><h3><Link to={postPath(item)}>{item.title}</Link></h3><p>{item.summary}</p><div className="blog-insight-footer"><span><img src={item.icon} alt="" aria-hidden="true"/>{item.tag}</span><Link className="blog-read" to={postPath(item)}>Read Article <ArrowRight size={14}/></Link></div></div></article>)}</div>
    </div></section><div className="blog-wrap blog-article-cta"><BlogCTA/></div>
  </main>;
}
