import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { fetchHealth } from './api'
import { fetchMeals, createMeal, type Meal } from './api/meals'

function App() {
  const [count, setCount] = useState(0)
  const [healthStatus, setHealthStatus] = useState<{ status: string; message: string; database?: string } | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        const [health, mealsData] = await Promise.all([fetchHealth(), fetchMeals()])
        setHealthStatus(health)
        setMeals(mealsData)
      } catch (error) {
        console.error('Initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleAddMeal = async () => {
    try {
      const names = ['Pizza', 'Salad', 'Burger', 'Pasta', 'Sushi'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomCalories = Math.floor(Math.random() * 800) + 200;
      
      const newMeal = await createMeal(randomName, randomCalories);
      setMeals([newMeal, ...meals]);
    } catch (error) {
      alert('Failed to add meal');
    }
  };

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Mealwise + MERN Stack</h1>
      
      <div className="card">
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Backend Status:</h3>
          {loading ? (
            <p>Checking connectivity...</p>
          ) : healthStatus ? (
            <p style={{ color: '#4CAF50' }}>✅ {healthStatus.message} (DB: {healthStatus.database || 'Connected'})</p>
          ) : (
            <p style={{ color: '#F44336' }}>❌ Could not connect to backend</p>
          )}
        </div>

        <button onClick={() => setCount((count) => count + 1)} style={{ marginRight: '10px' }}>
          count is {count}
        </button>
        
        <button onClick={handleAddMeal} style={{ backgroundColor: '#646cff', color: 'white' }}>
          Add Random Meal
        </button>

        <div style={{ marginTop: '20px' }}>
          <h3>Recent Meals:</h3>
          {meals.length === 0 ? (
            <p>No meals added yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {meals.map((meal) => (
                <li key={meal._id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <strong>{meal.name}</strong> - {meal.calories} kcal
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <p className="read-the-docs">
        Edit <code>src/App.tsx</code> to continue building Mealwise
      </p>
    </>
  )
}

export default App
