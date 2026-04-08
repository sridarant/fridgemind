import Discover from './Discover';
import ForYou from '../components/ForYou';
import CookOrOrder from '../components/CookOrOrder';

export default function Jiff(){
  return (
    <div>
      <ForYou />
      <Discover />
      <CookOrOrder />
    </div>
  );
}
