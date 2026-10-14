export function productSkeleton(count = 6) {
  return Array.from({length:count},()=>`<article class="product-card skeleton-card" data-skeleton aria-hidden="true">
    <div class="product-image-button skeleton-block"></div>
    <div class="card-body"><div class="skeleton-block skeleton-line short"></div>
      <div class="skeleton-block skeleton-line heading"></div><div class="skeleton-block skeleton-line medium"></div>
      <div class="card-specs skeleton-specs"><span class="skeleton-block"></span><span class="skeleton-block"></span><span class="skeleton-block"></span></div>
      <div class="card-stock"><span class="skeleton-block skeleton-line medium"></span><span class="skeleton-block skeleton-line short"></span></div>
    </div><div class="skeleton-card-footer"><span class="skeleton-block skeleton-line medium"></span></div>
  </article>`).join('');
}
export function clearSkeletons(container) {
  container.querySelectorAll('[data-skeleton]').forEach(node=>node.remove());
}
export function showProductSkeleton(container, {append = false, count = 6} = {}) {
  clearSkeletons(container);
  if (!append) container.replaceChildren();
  container.insertAdjacentHTML('beforeend',productSkeleton(count));
}
export function showCategorySkeleton(container) {
  container.innerHTML = Array.from({length:4},()=>'<div class="skeleton-category skeleton-block" data-skeleton aria-hidden="true"></div>').join('');
  container.setAttribute('aria-busy','true');
}
