import {useRef,useEffect} from 'react';
import {Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {ArrowUpRight,ArrowLeft,ArrowRight,Star} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {ProductCard} from './product-card';
import {catalogOptions} from '@/lib/catalog.functions';
import campaign from '@/assets/campaign.jpg';
import white from '@/assets/white-crew.jpg';

export function HomePage() {
  const {data} = useSuspenseQuery(catalogOptions());
  const rail = useRef<HTMLDivElement>(null);
  const reviews = useRef<HTMLDivElement>(null);
  
  const best = data.products.filter(x => x.best_seller);
  
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    // Auto-scroll for best sellers - one product at a time
    const bestTimer = setInterval(() => {
      if (rail.current && !rail.current.matches(':hover') && !rail.current.contains(document.activeElement)) {
        const el = rail.current;
        const cardWidth = el.children[0]?.getBoundingClientRect().width ?? 300;
        const gap = 20;
        const scrollAmount = cardWidth + gap;
        
        // Check if we're at the end
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          // Reset to start
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll to next product
          const currentIndex = Math.round(el.scrollLeft / scrollAmount);
          el.scrollTo({ left: (currentIndex + 1) * scrollAmount, behavior: 'smooth' });
        }
      }
    }, 3000); // Change product every 3 seconds
    
    // Auto-scroll for reviews
    const reviewTimer = setInterval(() => {
      if (reviews.current && !reviews.current.matches(':hover')) {
        const el = reviews.current;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) {
          el.scrollLeft = 0;
        } else {
          el.scrollLeft += 1;
        }
      }
    }, 30);
    
    return () => {
      clearInterval(bestTimer);
      clearInterval(reviewTimer);
    };
  }, []);
  
  return <>
    <section className="hero">
      <img className="hero-image" src={campaign} alt="VÉLIN oversized crew-neck collection worn in Cairo" width={1920} height={1024} fetchPriority="high"/>
      <div className="hero-copy">
        <span className="eyebrow">VÉLIN / THE NEW COLLECTION</span>
        <h1>Not just worn.<br/><em>Lived in.</em></h1>
        <p>Quiet confidence. Everyday essentials.<br/>A new way to make it yours.</p>
        <Button variant="secondary" className="hero-button" asChild>
          <Link to="/products">DISCOVER THE DROP <ArrowUpRight/></Link>
        </Button>
      </div>
      <div className="hero-caption">
        <span>THE EVERYDAY COLLECTION — VOL. 01</span>
        <div className="hero-page">01 <span/> 03</div>
      </div>
    </section>
    
    <div className="ticker">
      <span>DESIGNED FOR YOUR EVERYDAY</span><i>✦</i>
      <span>LESS NOISE. MORE YOU.</span><i>✦</i>
      <span>THE VÉLIN STATE OF MIND</span><i>✦</i>
      <span>DESIGNED FOR YOUR EVERYDAY</span>
    </div>
    
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">THE ONES YOU KEEP COMING BACK TO</span>
          <h2>Best sellers</h2>
        </div>
        <Link className="underlined-link" to="/products">SHOP ALL <ArrowUpRight/></Link>
      </div>
      <div className="product-slider" ref={rail}>
        {best.map(p => <ProductCard key={p._id} product={p}/>)}
      </div>
    </section>
    
    <section className="section about-section">
      <div className="about-container">
        <div className="about-content">
          <span className="section-kicker">ABOUT VÉLIN</span>
          <h2>Premium Everyday Essentials<br/>Since 2026</h2>
          <div className="about-text">
            <p>VÉLIN was founded in 2026 with a simple mission: to create timeless, high-quality everyday essentials that blend comfort with contemporary design.</p>
            <p>We believe in doing less, better. Every piece in our collection is thoughtfully designed using premium materials and superior craftsmanship. From the first sketch to the final stitch, we obsess over every detail to ensure our garments not only look exceptional but feel incredible to wear.</p>
            <p>Our collections feature carefully curated designs that transcend trends. We focus on versatile pieces that work seamlessly with your lifestyle, whether you're working, relaxing, or exploring the city.</p>
          </div>
          <div className="about-features">
            <div className="about-feature">
              <h3>Premium Materials</h3>
              <p>Only the finest fabrics and materials make it into our collection.</p>
            </div>
            <div className="about-feature">
              <h3>Timeless Design</h3>
              <p>Classic silhouettes with contemporary touches that never go out of style.</p>
            </div>
            <div className="about-feature">
              <h3>Exceptional Comfort</h3>
              <p>Designed to feel as good as they look, all day, every day.</p>
            </div>
            <div className="about-feature">
              <h3>Sustainable Approach</h3>
              <p>Quality over quantity. Pieces made to last, reducing waste.</p>
            </div>
          </div>
          <Link to="/products" className="underlined-link">EXPLORE THE COLLECTION <ArrowUpRight/></Link>
        </div>
      </div>
    </section>
    
    <section className="section collection-section">
      <Link to="/category/$category" params={{category: 'crow-neck'}} className="collection-photo">
        <img src={white} alt="Crow-neck collection" width={1024} height={1024} loading="lazy"/>
        <div className="collection-label">
          <span>Crow-neck</span>
          <ArrowUpRight size={20}/>
        </div>
      </Link>
      <div className="collection-copy">
        <span className="section-kicker">ONE FIT. ENDLESS POSSIBILITIES.</span>
        <h2>Your everyday,<br/>elevated.</h2>
        <p>The piece you reach for without thinking. Relaxed silhouettes, considered details, and a feel that gets better with every wear.</p>
        <Link to="/category/$category" params={{category: 'crow-neck'}} className="underlined-link">
          EXPLORE CROW-NECK <ArrowUpRight/>
        </Link>
      </div>
    </section>
    
    <section className="section reviews-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">FROM THE VÉLIN COMMUNITY</span>
          <h2>In good company.</h2>
        </div>
        <span className="section-kicker">PREVIEW REVIEWS</span>
      </div>
      <div className="review-slider" ref={reviews}>
        {[
          {text: 'The fit is exactly what I was looking for. Heavyweight, comfortable, and easy to wear with everything.', name: 'Omar A.', product: 'The Essential Crew'},
          {text: 'The details make the difference. Really love the oversized cut and the feel of the fabric.', name: 'Salma M.', product: 'The Everyday Crew'},
          {text: 'A clean everyday essential. The off-white colour is so good. Already want another one.', name: 'Youssef K.', product: 'The Essential Crew'},
          {text: 'Soft on the inside, structured on the outside. This is my new everyday favourite.', name: 'Nour H.', product: 'The Heavyweight Crew'}
        ].map(r => (
          <article key={r.name} className="review-card">
            <div className="review-stars">
              {Array.from({length: 5}, (_, i) => <Star key={i}/>)}
            </div>
            <blockquote>"{r.text}"</blockquote>
            <div className="review-name">{r.name}</div>
            <div className="review-meta">{r.product} · Sample review</div>
          </article>
        ))}
      </div>
    </section>
  </>;
}
