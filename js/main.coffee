---
---
((window) ->
  window.InstantClick.init()

  ### Re-bind collapse on DOM rewrite. ###

  InstantClick.on 'change', ->
    Collapses = document.querySelectorAll('[data-toggle="collapse"]')
    [].forEach.call Collapses, (item) ->
      options = {}
      options.duration = item.getAttribute('data-duration')
      new Collapse(item, options)
    return
  return
) this