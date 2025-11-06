import React from "react";

const CreateRoomModal = () => {
  return (
    <div>
      <h2>Create Channel</h2>
      <input type="text" placeholder="Name" />
      <input type="text" placeholder="Description" />

      <button>Create</button>
    </div>
  );
};

export default CreateRoomModal;
