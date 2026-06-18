import { Route, Routes } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import UserProfilePage from "./pages/UserProfilePage";
import BookPage from "./pages/BookPage";
import CreatePostPage from "./pages/CreatePostPage";
import CreateBookPage from "./pages/CreateBookPage";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/books/:id" element={<BookPage />} />
        <Route path="/create-book" element={<CreateBookPage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
      </Route>
    </Routes>
  );
}

export default App;
