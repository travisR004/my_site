class StaticPagesController < ApplicationController
  
  def root
    render :root
  end
  
  def asteroids
    render :asteroids
  end
  
  def snake
    render :snake
  end
end
