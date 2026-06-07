export async function uploadImage(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!data.secure_url) {
    console.error(data);
    throw new Error("Falha no upload para Cloudinary");
  }

  return data.secure_url;
}

export async function uploadPdf(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append(
    "upload_preset",
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${
      import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    }/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!data.secure_url) {
    console.error(data);
    throw new Error("Falha no upload do PDF");
  }

  console.log(data);
  return data.secure_url;
}