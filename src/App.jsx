// 外部 node_modules 資源
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";

// 內部 src 資源
// import './App.css'

// 環境變數
// const { VITE_BASE_URL, VITE_API_PATH} = import.meta.env;
const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  // Modal 相關
  const defaultModalData = {
    allergens: "",
    category: "",
    content: "",
    description: "",
    "description(en)": "",
    imageUrl: "",
    imagesUrl: [],
    ingredients: "",
    is_enabled: false,
    num: "",
    nutritionalInfo: [
      {
        name: "Calories (kcal)",
        value: "",
      },
      {
        name: "Protein (g)",
        value: "",
      },
      {
        name: "Fat (g)",
        value: "",
      },
      {
        name: "Carbohydrates (g)",
        value: "",
      },
      {
        name: "Sugar (g)",
        value: "",
      },
      {
        name: "Sodium (mg)",
        value: "",
      },
    ],
    origin_price: "",
    price: "",
    title: "",
    "title(en)": "",
    unit: "",
  };
  const productModalRef = useRef(null);
  const [modalType, setModalType] = useState("");
  const [modalData, setModalData] = useState(defaultModalData);

  const openModal = (product, type) => {
    setModalType(type);
    setModalData(product);

    productModalRef.current.show();
  };

  const closeModal = () => {
    productModalRef.current.hide();
  };


  // 處理 Modal 內通用的輸入欄位
  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;

    setModalData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 處理 Modal 內特定的 nutritionalInfo 欄位
  const handleModalNutritionalsChange = (e, index) => {
    const { value } = e.target;

    setModalData((prevData) => ({
      ...prevData,
      nutritionalInfo: prevData.nutritionalInfo.map((item, i) =>
        i === index ? { ...item, value: Number(value) } : item
      ),
    }));
  };

  // 處理 Modal 內圖片相關欄位
  const handleMoreImageInputChange = (e, index) => {
    const { value } = e.target;
    const newImages = [...modalData.imagesUrl];
    newImages[index] = value;
    setModalData((prevData) => ({
      ...prevData,
      imagesUrl: newImages,
    }));
  };

  const handleModalImageAdd = () => {
    const newImages = [...modalData.imagesUrl, ""];

    setModalData((prevData) => ({
      ...prevData,
      imagesUrl: newImages,
    }));
  };

  const handleModalImageRemove = () => {
    const newImages = [...modalData.imagesUrl];
    newImages.pop();
    setModalData((prevData) => ({
      ...prevData,
      imagesUrl: newImages,
    }));
  };

  // 產品 API 相關
  // const [tempProduct, setTempProduct] = useState({});
  // const [mainImage, setMainImage] = useState(null);
  const [products, setProducts] = useState([]);
  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/${API_PATH}/admin/products`
      );
      setProducts(response.data.products); 
    } catch (error) {
      console.dir(error);
      alert(`取得產品失敗: ${error.response.data.message}`);
    }
  };

  const createProduct = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/api/${API_PATH}/admin/product`, {
        data: {
          ...modalData,
          origin_price: Number(modalData.origin_price),
          price: Number(modalData.price),
          is_enabled: modalData.is_enabled ? 1 : 0,
        }
      });
      console.log(response);
      alert("新增成功");
      return true;
    } catch (error) {
      console.dir(error);
      const errorMessage = error.response.data.message.join(", ");    
      alert(`新增失敗: ${errorMessage}`);
      return false;
    }
  };

  const editProduct = async () => {
    console.log("edit");
    try {
      const response = await axios.put(`${BASE_URL}/api/${API_PATH}/admin/product/${modalData.id}`, {
        data: {
          ...modalData,
          origin_price: Number(modalData.origin_price),
          price: Number(modalData.price),
          is_enabled: modalData.is_enabled ? 1 : 0,
        }
      });
      console.log(response);
      alert("更新成功");
      return true;
    } catch (error) {
      console.dir(error);
      alert(`更新失敗: ${error.response.data.message}`);
      return false;
    }
  }

  const deleteProduct = async () => {
    console.log("delete");
    try {
      const response = await axios.delete(`${BASE_URL}/api/${API_PATH}/admin/product/${modalData.id}`);
      console.log(response);
      alert("刪除成功");
      return true;
    } catch (error) {
      console.dir(error);
      alert(`刪除失敗: ${error.response.data.message}`);
      return false;
    }
    
  }

  const handleProductModalAction = async () => {
    let actionSuccess = false;

    switch (modalType) {
      case "create":
        actionSuccess = await createProduct();
        break;
      case "edit":
        actionSuccess = await editProduct();
        break;
      case "delete":
        actionSuccess = await deleteProduct();
        break;
      default:
        throw new Error("unknown modalType");
    }

    if (actionSuccess) {
      closeModal();
      getProducts();
    }
  };

  // 登入相關
  const [isAuth, setIsAuth] = useState(false);
  const [account, setAccount] = useState({
    username: "example@test.com",
    password: "example",
  });

  const handleAdminSignInInputChange = (e) => {
    const { name, value } = e.target;
    setAccount({
      ...account,
      [name]: value,
    });
  };

  const adminSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${BASE_URL}/admin/signin`, account);
      const { expired, token } = response.data;
      setIsAuth(true);
      document.cookie = `hexToken=${token}; expires=${new Date(
        expired
      )}; SameSite=None; Secure`;
      axios.defaults.headers.common["Authorization"] = `${token}`;
      getProducts();
    } catch (error) {
      console.dir(error);
      alert(`登入失敗: ${error.response.data.error.message}`);
    }
  };

  const checkAdminLogin = async () => {
    try {
      await axios.post(`${BASE_URL}/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      console.dir(error);
      alert(error.response.data.message);
    }
  };

  // 使用 useEffect 監聽 tempProduct 的變化
  // useEffect(() => {
  //   if (tempProduct) {
  //     setMainImage(tempProduct.imageUrl); // 當 tempProduct 更新後執行
  //   }
  // }, [tempProduct]);


  // 進入頁面時，確認是否有登入
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];
    axios.defaults.headers.common["Authorization"] = token;

    // 建立 Modal 實體
    productModalRef.current = new bootstrap.Modal("#productModal");

    checkAdminLogin();
  }, []);

  return (
    <>
      {isAuth ? (
        <div className="container">
          <div className="row mt-5">
            <div className="col">
              {/* <button type="button" className="btn btn-danger" onClick={checkLogin}>檢查使用者是否登入</button> */}
              <div className="d-flex justify-content-between align-items-center">
                <h2>產品列表</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openModal(defaultModalData, "create")}
                >
                  Create New Product
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col">編輯</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.title}</td>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>
                        {
                          product.is_enabled ? (<span className="text-success">啟用</span>) : (<span>未啟用</span>)
                        }
                      </td>
                      <td>
                        <div className="btn-group">
                          {/* <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setTempProduct(product)}
                          >
                            編輯
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => setTempProduct(product)}
                          >
                            刪除
                          </button> */}
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => openModal(product, "edit")}
                          >
                            編輯
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => openModal(product, "delete")}
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* 單一產品細節 */}
            {/* <div className="col-md-6">
                <div className="d-flex align-items-center">
                  <h2>單一產品細節</h2>
                  <button type="button" className="btn btn-primary ms-2 mb-2" onClick={() => setTempProduct({})}>重置</button>
                </div>
                {
                  tempProduct.title ?
                    ( <div className="card">
                      <img src={mainImage || tempProduct.imageUrl} className="card-img-top object-fit-contain main-image" alt="main image" />
                      <div className="card-body">
                        <h5 className="card-title d-flex align-items-center">
                          { tempProduct.title }
                          <span className="badge text-bg-primary ms-2">{ tempProduct.category }</span>
                        </h5>
                        
                        <p className="card-text">商品描述：<br />{ tempProduct.description }</p>
                        <p className="card-text">Allergens：{ tempProduct.allergens }</p>
                        <p className="card-text">Ingredient：{ tempProduct.ingredients }</p>
                        <table className="table table-striped">
                          <thead>
                            <tr>
                              <th scope="col"></th>
                              <th scope="col">Per 100g</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tempProduct.nutritionalInfo.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name}</td>
                                <td>{item.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="card-text">£{ tempProduct.price } / <del className="text-secondary">{ tempProduct.origin_price } </del></p>
                        <h5>更多圖片：</h5>
                        <div className="d-flex flex-wrap gap-3">
                          <img className={`more-images ${mainImage === tempProduct.imageUrl ? 'active' : ''}`} src={tempProduct.imageUrl} onClick={() => setMainImage(tempProduct.imageUrl)}/>
                          {
                            tempProduct.imagesUrl?.map((url, index) => (
                                <img className={`more-images ${mainImage === url ? 'active' : ''}`} key={index}  src={url} alt="more image" onClick={() => setMainImage(url)}/>
                            ))
                          }
                        </div>
                      </div>
                    </div>) 
                    : (<p className="text-secondary">請選擇一個商品查看</p>)
                }
              </div> */}
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">
            請先登入 <i className="bi bi-box-arrow-in-left"></i>
          </h1>
          <form onSubmit={adminSignIn} className="d-flex flex-column gap-3">
            <div className="form-floating mb-3">
              <input
                name="username"
                value={account.username}
                onChange={handleAdminSignInInputChange}
                type="email"
                className="form-control"
                id="username"
                placeholder="name@example.com"
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                name="password"
                value={account.password}
                onChange={handleAdminSignInInputChange}
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
              />
              <label htmlFor="password">Password</label>
            </div>
            <button type="submit" className="btn btn-primary">
              登入
            </button>
          </form>
          <p className="mt-5 mb-3 text-secondary">
            &copy; 2024 - Regis's Cakes
          </p>
        </div>
      )}

      {/* <!-- Modal --> */}
      <div
        id="productModal"
        className="modal fade"
        tabIndex="-1"
        aria-labelledby="productModalLabel"
        aria-hidden="true"
        ref={productModalRef}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div
              data-bs-theme="dark"
              className={`modal-header ${
                modalType === "delete" ? "text-bg-danger" : "text-bg-dark"
              }`}
            >
              <h1 className="modal-title fs-5" id="productModalLabel">
                {modalType === "edit"
                  ? "Edit Product"
                  : modalType === "delete"
                  ? "刪除產品"
                  : "Create New Product"}
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => closeModal()}
              ></button>
            </div>
            <div className="modal-body">
              {modalType === "delete" ? (
                <p className="h4 text-center">
                  確定要刪除
                  <span className="text-danger">{modalData.title}</span>嗎？
                </p>
              ) : (
                <div className="row">
                  <div className="col-md-4">
                    {/* Main image */}
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          Main Image
                        </label>
                        <input
                          name="imageUrl"
                          value={modalData.imageUrl}
                          onChange={handleModalInputChange}
                          type="text"
                          className="form-control"
                          id="imageUrl"
                          placeholder="Please input image url"
                        />
                      </div>
                      {
                        modalData.imageUrl && (
                          <img
                            src={modalData.imageUrl}
                            alt={`${modalData.title} 主圖`}
                            className="img-fluid"
                          />
                        )
                      }
                    </div>
                    {/* More images */}
                    <div className="mb-2 border p-3 rounded">
                      <h6>More Images</h6>
                      {modalData.imagesUrl?.map((url, index) => (
                        <div
                          key={index}
                          className={`py-3 ${index > 0 ? "border-top" : ""}`}
                        >
                          <div className={`mb-3`}>
                            <label
                              htmlFor={`moreImages-${index + 1}`}
                              className="form-label"
                            >
                              {index + 1}
                            </label>
                            <input
                              name="imagesUrl"
                              value={url}
                              onChange={(e) =>
                                handleMoreImageInputChange(e, index)
                              }
                              type="text"
                              className="form-control"
                              id={`moreImages-${index + 1}`}
                              placeholder={`Image url ${index + 1}`}
                            />
                          </div>
                          {url && (
                            <img
                              src={url}
                              alt={`moreImages-${index + 1}`}
                              className="img-fluid"
                            />
                          )}
                        </div>
                      ))}
                      <div className="btn-group w-100">
                        {modalData.imagesUrl.length < 5 &&
                          modalData.imagesUrl[
                            modalData.imagesUrl.length - 1
                          ] !== "" && (
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={handleModalImageAdd}
                            >
                              Add more image
                            </button>
                          )}
                        {modalData.imagesUrl.length >= 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={handleModalImageRemove}
                          >
                            Cancel image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        Title
                      </label>
                      <input
                        name="title"
                        value={modalData.title}
                        onChange={handleModalInputChange}
                        type="text"
                        className="form-control"
                        id="title"
                        placeholder="Please enter the title"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="category" className="form-label">
                        Category
                      </label>
                      <input
                        name="category"
                        value={modalData.category}
                        onChange={handleModalInputChange}
                        type="text"
                        className="form-control"
                        id="category"
                        placeholder="Please enter the category"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="unit" className="form-label">
                        Unit
                      </label>
                      <input
                        name="unit"
                        value={modalData.unit}
                        onChange={handleModalInputChange}
                        type="text"
                        className="form-control"
                        id="unit"
                        placeholder="Please enter the unit"
                      />
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="origin_price" className="form-label">
                            Origin Price
                          </label>
                          <input
                            name="origin_price"
                            value={modalData.origin_price}
                            onChange={handleModalInputChange}
                            type="number"
                            className="form-control"
                            id="origin_price"
                            placeholder="Please enter the origin_price"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="price" className="form-label">
                            Price
                          </label>
                          <input
                            name="price"
                            value={modalData.price}
                            onChange={handleModalInputChange}
                            type="number"
                            className="form-control"
                            id="price"
                            placeholder="Please enter the price"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={modalData.description}
                        onChange={handleModalInputChange}
                        className="form-control"
                        id="description"
                        placeholder="Please enter the description"
                        rows={4}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="allergens" className="form-label">
                        Allergens
                      </label>
                      <textarea
                        name="allergens"
                        value={modalData.allergens}
                        onChange={handleModalInputChange}
                        className="form-control"
                        id="allergens"
                        placeholder="Please enter the allergens"
                        rows={4}
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="ingredients" className="form-label">
                        Ingredients
                      </label>
                      <textarea
                        name="ingredients"
                        value={modalData.ingredients}
                        onChange={handleModalInputChange}
                        className="form-control"
                        id="ingredients"
                        placeholder="Please enter the ingredients"
                        rows={4}
                      ></textarea>
                    </div>
                    <fieldset className="mb-3">
                      <legend className="fs-6">Nutritionals</legend>
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th scope="col"></th>
                            <th scope="col">Per 100g</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalData.nutritionalInfo.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <label htmlFor={item.name}>{item.name}</label>
                              </td>
                              <td>
                                <input
                                  name={item.name}
                                  value={item.value}
                                  onChange={(e) =>
                                    handleModalNutritionalsChange(e, index)
                                  }
                                  id={item.name}
                                  type="number"
                                  className="form-control"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </fieldset>
                    <div className="form-check">
                      <input
                        name="is_enabled"
                        checked={modalData.is_enabled}
                        onChange={handleModalInputChange}
                        className="form-check-input"
                        type="checkbox"
                        id="isEnabled"
                      />
                      <label className="form-check-label" htmlFor="isEnabled">
                        Enabled
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={() => closeModal()}
              >
                取消
              </button>
              {
                modalType === "delete" ? (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleProductModalAction}
                  >
                    刪除
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleProductModalAction}
                  >
                    確認
                  </button>
                )
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
