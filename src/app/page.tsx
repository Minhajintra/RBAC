import { redirect } from "next/navigation";

// Root page: Direct /login route par redirect karta hai
export default function HomePage() {
  redirect("/login");
}
