(function($){
	var res = {
		'int' : /^\d+$/,
		'email' : /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/,
	}

	function ucfirst(str)
	{
		return str.slice(0,1).toUpperCase()+str.slice(1);
	}

	$.checkableForm = function(formid,submitcallback)
	{
		var form = $(formid);
		form.find('input[type="text"],input[type="password"]').val('');
		var beChecking = form.find('input.checkable,select.checkable');
		var submittable = false;
		var errorNum = 0;
		for (var i =0;i<beChecking.size();i++)
		{
			var item = beChecking.eq(i);
			var re = res[item.attr('data-checktype')];
			if(!re)
				return;
			(function(regex,domitem){
				domitem.keyup(function(){
					var value = $(this).val();
					var checktype = $(this).attr('data-checktype');
					if(!regex.test(value))
					{
						if(!domitem.parent().parent().hasClass('error')){
							domitem.parent().parent().addClass('error');
							domitem.parent().append($("<span class='help-inline'>Invalid input type. You need enter a "+checktype+"</span>"));
							domitem.addClass('errorChecked');
							errorNum++;
						}
						submittable = false;
					}
					else
					{
						if(domitem.hasClass('errorChecked'))
						{
							domitem.parent().parent().removeClass('error');
							domitem.parent().find('span.help-inline').remove();
							domitem.removeClass('errorChecked');
							errorNum--;
							if(errorNum<=0)
								submittable = true;
						}
					}

				})
			})(re,item);
		}
		form.on('submit',function(e){
			console.log('before submit');
			e.preventDefault();
			$(this).find('input').each(function(){
				var value = $(this).val();
				if(!value || value=='')
					errorNum++;
			});
			if(errorNum > 0)
				submittable = false;
			else
				submittable = true;
			if(submittable)
			{
				console.log('submit');
				if(submitcallback)
					submitcallback.call(form);
				else
					$(this).submit();
			}
			else
			{
				console.log(errorNum);
				return;
			}
		})
	}

	window.Popup = function(query)
	{
		var dom = $(query);
		this.selectData = [];
		this.modalConfig;
		this.deleteCallback;
		this.saveCallback;
		this.closeCallback;
		this.titleLabel = '';
		// var mode = dom.attr('data-mode');
		var _self = this;
		this.watching = function(modalq)
		{
			if(dom.size()<=0)
				return;
			var modal = $(modalq);
			if(modal.size() == 1)
			{
				dom.off('click').click(function(){
					var mode = $(this).attr('data-mode');
					var modal_select = modal.find("#modal_select");
					var modal_input = modal.find("input");
					var datatype = $(this).attr('data-type');
					var rawValue = $(this).val();
					var currentDom = this;
					if(rawValue && rawValue!=''){
						var rawSelectType = rawValue.split(':')[0];
						var rawContent = rawValue.split(":")[1];
					}
					modal_select.val('');
					modal_select.html('');
					modal_input.val('');
					console.log(_self.selectData);
					for(var x in _self.selectData)
					{
						var d = _self.selectData[x];
						var option = $("<option value='"+d+"'>"+d+"</option>");
						modal_select.append(option);
					}
					if(rawSelectType)
					{
						modal_select.val(rawSelectType);
					}
					if(rawValue)
					{
						modal_input.val(rawContent);
					}
					modal.find(_self.titleLabel).text(ucfirst(datatype));
					console.log("this mode is "+mode);
					if(mode == 'update' && modal.find('button#deletebtn').size()==0)
					{
						console.log('append delete button');
						modal.find('.modal-footer').append($('<button id="deletebtn" class="btn btn-danger">Delete</button>'))
					}
					else if (mode!='update')
					{
						modal.find('.modal-footer').find('button#deletebtn').remove();
					}
					modal.find("#deletebtn").off('click').click(function(){
						_self.deleteCallback.apply(currentDom,arguments);
					});
					modal.find("#savebtn").off('click').click(function(e){
						_self.saveCallback.apply(currentDom,arguments);
					});
					if(_self.modalConfig)
					{
						modal.modal(_self.modalConfig);
					}
					else
					{
						modal.modal();
					}
				});
			}
		}
		this.config = function(obj){
			if(obj.onSave)
				this.saveCallback = obj.onSave;
			if (obj.onDelete)
				this.deleteCallback = obj.onDelete;
			if(obj.selectData)
				this.selectData = obj.selectData;
			if(obj.modalConfig)
				this.modalConfig = obj.modalConfig;
			if(obj.titleLabel)
				this.titleLabel = obj.titleLabel;
			if(obj.closeItem)
				this.closeItem = obj.closeItem;
		}

		this.modalClose = function()
		{
			$(this.closeItem).trigger('click');
		}

		//proxy for watching
		// this.watch = function(modalq)
		// {
		// 	_watching.call(_self,modalq);
		// }
	}
})(jQuery);
