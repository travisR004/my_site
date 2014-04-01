Travisarandolph::Application.routes.draw do
  root to: "static_pages#root"
  get "asteroids", to: "static_pages#asteroids"
  get "snake", to: "static_pages#snake"
end
