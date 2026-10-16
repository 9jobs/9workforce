import React, {useMemo, useState} from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import {ArrowRight, Check, ChevronDown} from 'lucide-react';
import {blogPosts, featuredSections, featuredCopy} from './blogData';
import './blog-page.css';

const categories = ['All Articles','Labour Hire','Recruitment','Site Safety','Construction Industry','Workforce Planning'];
const clean = value => value.toLowerCase().replace('construction recruitment','recruitment');
const postPath = post => `/blog/${post.slug}`;
const BlogVector = ({name}) => <img className="blog-icon" src={`/assets/blog/${name}.svg`} alt="" aria-hidden="true"/>;
const AssetIcon = ({number, ...props}) => <img className="blog-icon" src={`/assets/blog/icon-${number}.svg`} alt="" aria-hidden="true" {...props}/>;

function BlogCTA() {
  return <section className="blog-cta" aria-labelledby="blog-cta-heading"><div>
    <h2 id="blog-cta-heading">Need construction workers for your<br/>next project?</h2>
    <p>Share your project and workforce requirements with the 9 Work Force team.<br/>From general labourers to certified plant operators, we deploy vetted personnel across Melbourne within 24 hours.</p>
    <div className="blog-cta-notes"><span><BlogVector name="list-vector-12"/>VIC Labour Hire Authority Licensed</span><span><BlogVector name="list-vector-13"/>Rapid Site Dispatch</span><span><BlogVector name="list-vector-8"/>WorkSafe Compliant Inductions</span></div>
  </div><div className="blog-cta-actions"><Link className="btn orange" to="/request-workers">Request Workers <ArrowRight size={14}/></Link><Link className="btn light" to="/find-work#register">Register for Work</Link></div></section>;
}

export default function BlogPage() {
  const [category,setCategory] = useState('All Articles');
  const [query,setQuery] = useState('');
  const posts = useMemo(()=>blogPosts.filter(post => (category==='All Articles'||clean(post.category)===clean(category))&&`${post.title} ${post.summary} ${post.category}`.toLowerCase().includes(query.trim().toLowerCase())),[category,query]);
  return <main className="blog-page">
    <section className="blog-intro"><div className="blog-wrap"><h1>Construction Insights &amp; Updates.</h1><p>Practical insights on construction labour hire, workforce requirements, site safety and<br className="blog-desktop-break"/> industry developments across Melbourne and Victoria.</p><div className="blog-verification"><span><AssetIcon number={1}/>VIC Labour Hire Authority Verified Content</span><b>•</b><small>Updated weekly from Tier-1 Victorian worksites</small></div></div></section>
    <section className="blog-toolbar" aria-label="Filter articles"><div className="blog-wrap"><div className="blog-filters">{categories.map(value=><button key={value} type="button" aria-pressed={category===value} onClick={()=>setCategory(value)}>{value}</button>)}</div><label className="blog-search"><BlogVector name="list-vector-5"/><span className="blog-sr">Search construction articles</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search construction articles..."/></label></div></section>
    <section className="blog-wrap blog-listing" aria-label="Construction articles"><div className="blog-posts" aria-live="polite">{posts.map(post=><article className="blog-card" key={post.slug}><Link className="blog-card-photo" to={postPath(post)} aria-label={`Read ${post.title}`}><img src={post.image} alt={post.title} loading="lazy"/></Link><div className="blog-card-copy"><div className="blog-meta"><span className="blog-category">{post.category}</span></div><h2><Link to={postPath(post)}>{post.title}</Link></h2><p>{post.summary}</p><div className="blog-card-actions"><span><img className="blog-icon" src={post.icon} alt="" aria-hidden="true"/>{post.tag}</span><Link className="blog-read" to={postPath(post)}>Read Article <BlogVector name="list-vector-6"/></Link></div></div></article>)}{!posts.length&&<div className="blog-empty"><h2>No matching articles</h2><p>Try another category or search term.</p><button type="button" onClick={()=>{setCategory('All Articles');setQuery('');}}>View all articles</button></div>}</div><div className="blog-pagination"><p>Showing <strong>{posts.length}</strong> of <strong>{blogPosts.length}</strong> articles across Victoria</p><nav aria-label="Article pages"><button type="button" disabled>Previous</button><button type="button" aria-current="page">1</button><button type="button" disabled>Next</button></nav></div><BlogCTA/></section>
  </main>;
}

function ArticleShare() {
  const [copied,setCopied] = useState(false);
  const [error,setError] = useState('');
  const url = window.location.href.split('#')[0];
  async function copy() {try {await navigator.clipboard.writeText(url);setCopied(true);setError('');} catch {setError('Copy the article URL from your browser address bar.');}}
  return <div className="blog-share"><strong><BlogVector name="article-vector-6"/>Share this article</strong><div><a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">LinkedIn</a><a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">Facebook</a><button type="button" onClick={copy}>{copied?<Check size={14}/>:<BlogVector name="article-vector-16"/>} {copied?'Copied':'Copy Link'}</button></div><span className="blog-sr" role="status">{copied?'Article link copied.':error}</span></div>;
}

export function BlogArticle() {
  const {slug} = useParams();
  const post = blogPosts.find(item=>item.slug===slug);
  if(!post)return <Navigate to="/blog" replace/>;
  const featured=post===blogPosts[0];
  const subsets = [[0,1,2,3,4,5,6,7,8],[0,5,6,7],[0,6,7],[0,3,5,8],[0,5,7]];
  const sections=subsets[blogPosts.indexOf(post)].map(index=>({...featuredSections[index],original:index}));
  return <main className="blog-page blog-article-page">
    <header className="blog-wrap blog-article-heading"><h1>{post.title}</h1><div className="blog-meta"><span>By <strong>9 Work Force Industry Desk</strong></span></div><p>{featured?featuredCopy.intro:post.summary}</p></header>
    <div className="blog-wrap"><figure className="blog-article-hero"><img src={post.image} alt={post.title}/><figcaption><span><BlogVector name="article-vector-5"/>{featured?featuredCopy.heroCaption:post.tag}</span><b>TIER-1 CIVIL WORKS</b></figcaption></figure>
      <div className="blog-article-grid"><article className="blog-body"><details className="blog-mobile-toc"><summary>In this article <ChevronDown size={15}/></summary><ol>{sections.map((section,index)=><li key={section.title}><a href={`#article-section-${index+1}`}>{section.title.replace(/^\d+\. /,'')}</a></li>)}</ol></details>{sections.map((section,index)=><section className="blog-prose-section" id={`article-section-${index+1}`} key={section.title}><span className="blog-eyebrow">{section.eyebrow}</span><h2>{index+1}. {section.title.replace(/^\d+\. /,'')}</h2>{section.paragraphs.map((paragraph,i)=><React.Fragment key={paragraph}><p>{paragraph}</p>{featured&&section.original===1&&i===0&&<aside className="blog-takeaway"><span className="blog-takeaway-icon"><BlogVector name="article-vector-12"/></span><div><h3>Key Industry Takeaway</h3><p>{featuredCopy.takeaway}</p></div></aside>}</React.Fragment>)}{featured&&section.original===3&&<blockquote><span>“</span><p>{featuredCopy.quote.replace(/^"|"$/g,'')}</p><cite><strong>{featuredCopy.quoteAuthor}</strong> {featuredCopy.quoteRole}</cite></blockquote>}{featured&&section.original===4&&<figure className="blog-inline-photo"><img src="/assets/toolbox-talk.webp" alt="Construction crew receiving a site safety briefing" loading="lazy"/><figcaption>{featuredCopy.inlineCaption}<small>Safety Audit Tier 1</small></figcaption></figure>}</section>)}<ArticleShare/></article>
        <aside className="blog-sidebar"><nav className="blog-toc" aria-label="Table of contents"><h2><BlogVector name="article-vector-20"/>TABLE OF CONTENTS</h2><ol>{sections.map((section,index)=><li key={section.title}><a href={`#article-section-${index+1}`}>{section.title.replace(/^\d+\. /,'')}</a></li>)}</ol></nav><div className="blog-side-cta"><span className="blog-eyebrow">ON-DEMAND CREWS</span><h2>Require Labour for Your Site?</h2><p>Fast, ticketed worker dispatch across Victoria. Civil, commercial &amp; industrial contractors ready for rapid deployment.</p><ul><li><BlogVector name="article-vector-3"/>100% White Card &amp; Ticket Verified</li><li><BlogVector name="article-vector-11"/>VIC Labour Hire Authority Licensed</li><li><BlogVector name="article-vector-1"/>24/7 Operations Desk Support</li></ul><Link className="btn orange" to="/request-workers">Request Workers <ArrowRight size={12}/></Link></div><div className="blog-author"><span className="blog-eyebrow">EDITORIAL AUTHORITY</span><h3><b className="blog-author-mark">9</b>9 Work Force Desk</h3><small>Melbourne Infrastructure Analytics</small><p>Compiled by our compliance coordinators and site managers operating across civil projects throughout Greater Melbourne.</p></div></aside>
      </div>
    </div><section className="blog-related"><div className="blog-wrap"><span className="blog-eyebrow">INSIGHTS &amp; PERSPECTIVES</span><div className="blog-related-heading"><div><h2>Continue Reading</h2><p>Explore more insights on Australian construction labour hire and safety.</p></div><Link to="/blog">View all industry insights <ArrowRight size={12}/></Link></div><div className="blog-related-grid">{blogPosts.filter(item=>item!==post).slice(0,3).map((item,index)=><article key={item.slug}><Link to={postPath(item)}><img src={item.image} alt={item.title} loading="lazy"/></Link><div><span className="blog-category">{item.category}</span><h3><Link to={postPath(item)}>{item.title}</Link></h3><p>{item.summary}</p><Link className="blog-read" to={postPath(item)}>Read Article <BlogVector name="list-vector-6"/></Link></div></article>)}</div></div></section><div className="blog-wrap blog-article-cta"><BlogCTA/></div>
  </main>;
}
