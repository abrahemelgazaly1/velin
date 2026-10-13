import {useState} from 'react';
import {Link} from '@tanstack/react-router';
import {Minus,Plus,Heart,ArrowUpRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useStore} from './store-context';
import {coloursOf} from '@/lib/store';
import type { Product } from '@/lib/types';
import {notify} from '@/lib/alerts';

export function Quantity({value,onChange}:{value:number;onChange:(v:number)=>void}) {
  return (
    <div className="quantity">
      <Button variant="ghost" size="icon" aria-label="Decrease quantity" onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus/>
      </Button>
      <span>{value}</span>
      <Button variant="ghost" size="icon" aria-label="Increase quantity" onClick={() => onChange(Math.min(99, value + 1))}>
        <Plus/>
      </Button>
    </div>
  );
}

export function ProductControls({product, compact = false}: {product: Product; compact?: boolean}) {
  const store = useStore();
  const [size, setSize] = useState('');
  const [colour, setColour] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  
  const colours = coloursOf(product);
  const valid = !!size && !!colour && !product.sold_out && 
    !(product.sold_sizes || []).includes(size) && 
    !(product.sold_colours || []).includes(colour);
  
  async function add() {
    if (!valid) {
      await notify('Choose your options', 'Please select an available size and colour.', 'info');
      return;
    }
    setBusy(true);
    await store.add(product, size, colour, quantity);
    setBusy(false);
  }
  
  return (
    <div className="product-controls">
      <div className="option-label">SIZE <span>{size || 'Select size'}</span></div>
      <div className="size-options">
        {product.sizes.map(s => {
          const isSoldOut = product.sold_out || (product.sold_sizes || []).includes(s);
          return (
            <Button 
              key={s} 
              variant={size === s ? 'default' : 'outline'} 
              disabled={isSoldOut}
              onClick={() => setSize(s)}
              className={isSoldOut ? 'sold-out-option' : ''}
            >
              {s}
              {isSoldOut && <span className="sold-out-badge">Sold Out</span>}
            </Button>
          );
        })}
      </div>
      
      <div className="option-label">COLOUR <span>{colour || 'Select colour'}</span></div>
      <div className="colour-options">
        {colours.map(c => {
          const isSoldOut = product.sold_out || (product.sold_colours || []).includes(c.name);
          return (
            <div key={c.name} className="colour-option-wrapper">
              <Button 
                variant="ghost" 
                className={`colour-choice ${colour === c.name ? 'selected' : ''} ${isSoldOut ? 'sold-out-colour' : ''}`}
                disabled={isSoldOut}
                title={isSoldOut ? `${c.name} - Sold Out` : c.name}
                aria-label={c.name}
                onClick={() => setColour(c.name)}
              >
                <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                  <circle cx="13" cy="13" r="12" fill={c.hex}/>
                  {isSoldOut && <line x1="3" y1="23" x2="23" y2="3" stroke="currentColor" strokeWidth="2"/>}
                </svg>
              </Button>
              {isSoldOut && <span className="colour-sold-label">Sold Out</span>}
            </div>
          );
        })}
      </div>
      
      <div className="option-label">QUANTITY</div>
      <Quantity value={quantity} onChange={setQuantity}/>
      
      <div className={compact ? 'quick-actions' : 'add-action'}>
        <Button 
          size="lg" 
          className="shop-button" 
          disabled={product.sold_out || busy || !store.ready} 
          onClick={add}
        >
          {product.sold_out ? 'SOLD OUT' : busy ? 'ADDING…' : 'ADD TO CART'} <ArrowUpRight/>
        </Button>
        {compact && (
          <Button variant="outline" size="lg" onClick={() => store.setQuick(null)}>
            CANCEL
          </Button>
        )}
      </div>
      
      {!compact && (
        <div className="checkout-actions">
          <Button variant="outline" size="lg" disabled={product.sold_out || !valid} asChild>
            <Link to="/checkout">PROCEED TO CHECKOUT <ArrowUpRight/></Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            aria-label="Add to wishlist" 
            onClick={() => store.toggleWish(product._id)}
          >
            <Heart fill={store.wishlist.includes(product._id) ? 'currentColor' : 'none'}/>
          </Button>
        </div>
      )}
    </div>
  );
}
