// 图片上传示例

// 1. 基本上传示例
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tags', 'example,demo');
  formData.append('description', '这是一个示例图片');
  formData.append('isPublic', 'true');

  try {
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('上传成功:', result.images);
      return result.images[0];
    } else {
      console.error('上传失败:', result.message);
      return null;
    }
  } catch (error) {
    console.error('上传错误:', error);
    return null;
  }
}

// 2. 获取图片列表
async function getImages(page = 1, limit = 20) {
  try {
    const response = await fetch(`/api/images?page=${page}&limit=${limit}&stats=true`);
    const result = await response.json();
    
    if (result.success) {
      console.log('图片列表:', result.images);
      console.log('统计信息:', result.stats);
      return result;
    }
  } catch (error) {
    console.error('获取图片列表失败:', error);
  }
}

// 3. 搜索图片
async function searchImages(query, page = 1) {
  try {
    const response = await fetch(`/api/images?search=${encodeURIComponent(query)}&page=${page}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('搜索结果:', result.images);
      return result.images;
    }
  } catch (error) {
    console.error('搜索失败:', error);
  }
}

// 4. 获取单个图片详情
async function getImageDetail(id) {
  try {
    const response = await fetch(`/api/images/${id}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('图片详情:', result.image);
      return result.image;
    }
  } catch (error) {
    console.error('获取图片详情失败:', error);
  }
}

// 5. 更新图片信息
async function updateImage(id, updates) {
  try {
    const response = await fetch(`/api/images/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('更新成功:', result.image);
      return result.image;
    }
  } catch (error) {
    console.error('更新失败:', error);
  }
}

// 6. 删除图片
async function deleteImage(id) {
  try {
    const response = await fetch(`/api/images/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('删除成功');
      return true;
    }
  } catch (error) {
    console.error('删除失败:', error);
    return false;
  }
}

// 使用示例
document.addEventListener('DOMContentLoaded', function() {
  // 文件上传处理
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', async function() {
      const file = fileInput.files[0];
      if (file) {
        console.log('开始上传:', file.name);
        const result = await uploadImage(file);
        if (result) {
          console.log('上传完成，图片ID:', result.id);
        }
      } else {
        alert('请选择文件');
      }
    });
  }

  // 加载图片列表
  getImages(1, 10);
});

// 导出函数供其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    uploadImage,
    getImages,
    searchImages,
    getImageDetail,
    updateImage,
    deleteImage
  };
}
