import { useParams } from 'react-router-dom';

export default function Recipe() {
  const { id } = useParams<{ id: string }>();
  console.log('Recipe ID:', id);
  
  return <div>Recipe {id}</div>;
}
