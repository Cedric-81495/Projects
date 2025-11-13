import api from "../lib/axios"
import { toast } from "react-hot-toast";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";  

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false); 

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!title.trim || !content.trim()){
      toast.error("All fileds are required");
      return;
    }
    
    setLoading(true);
    try{
     await api.post("/notes", {
      title,
      content,
     });
     toast.success("Note created successfully");
     navigate("/");
    }catch(error){
      console.log("Error creating note", error);
      if (error.response.status === 429){
             toast.error("slow donw! You're creating notes too fast", {
              duration: 4000,
              icond: "💀",
             });
      }else{
         toast.error("Failed to create note");
      }

    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="btn btn-ghost mb-4">
            <ArrowLeftIcon className="size-4" />
            Back to Board
          </Link>

          <div className="card bg-base-100">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Create New Note</h2>

              <form onSubmit={handleSubmit}>
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Note Title"
                    className="input input-bordered"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Content</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Note Content"
                    className="input input-bordered"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="card-actions justify-end">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Creating..." : "Create Note"}
                  </button>
                </div>
              </form>
            </div>  
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
