import { useParams } from 'react-router-dom';

export default function Cookbook() {
  const { id } = useParams<{ id: string }>();
  console.log('Cookbook ID:', id);

  return <div>Cookbook {id}</div>;
}
